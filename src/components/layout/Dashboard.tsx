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
import { FileText, BarChart3, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud, ArrowRight, Plus, CheckCircle, RefreshCw, RotateCcw, Download, Bell, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { api, detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  const [showEvidencePrompt, setShowEvidencePrompt] = useState<boolean>(false);
  // Sync status fields from API response
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [recoverySource, setRecoverySource] = useState<string | null>(null);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
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
    { id: 'upcoming_payments', label: 'Upcoming payments' },
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
            
            // Show enhanced toast with claims detected info
            const claimsDetected = syncStatus.lastSync.claimsDetected ?? 0;
            const ordersProcessed = syncStatus.lastSync.ordersProcessed ?? 0;
            
            toast({
              title: 'Sync Complete',
              description: 'Complete successfully. See dashboard.',
              duration: 5000,
            });
            
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
            
            // Show enhanced toast with claims detected info
            const claimsDetected = status.claimsDetected ?? 0;
            const ordersProcessed = status.ordersProcessed ?? 0;
            
            toast({
              title: 'Sync Complete',
              description: 'Complete successfully. See dashboard.',
              duration: 5000,
            });
            
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

    async function fetchUpcomingPayments() {
      try {
        const payments = await recoveryApi.getRecoveries();
        if (!active) return;
        updateUpcomingMetrics(Array.isArray(payments) ? payments : []);
      } catch (error) {
        console.error('[Dashboard] Failed to fetch upcoming payments:', error);
      }
    }

    // Initial fetch immediately on mount
    fetchRecoveriesOnce();
    fetchMetrics();
    fetchUpcomingPayments();
    // Decide whether to prompt evidence connections (Gmail/Outlook/Drive/Dropbox)
    (async () => {
      try {
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('clario.evidencePromptDismissed') === 'true' : false;
        if (dismissed) return;
        const s = await api.getIntegrationsStatus();
        if (s.ok) {
          const prov = (s.data as any)?.providerIngest || {};
          const anyConnected = Boolean(prov.gmail?.connected || prov.outlook?.connected || prov.gdrive?.connected || prov.dropbox?.connected);
          if (!anyConnected) setShowEvidencePrompt(true);
        } else {
          // If status unknown, still prompt once
          setShowEvidencePrompt(true);
        }
      } catch {
        setShowEvidencePrompt(true);
      }
    })();
    hasFetchedRef.current = true;

    // Short burst polling to show numbers populate quickly
    let polls = 0;
    pollTimer = window.setInterval(async () => {
      polls += 1;
      await fetchRecoveriesOnce();
      await fetchMetrics();
      await fetchUpcomingPayments();
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
            await fetchUpcomingPayments();
          }
        } catch {}
      };
    } catch {}

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
          <div className="relative pt-24">
                <div className="relative container mx-auto px-6 md:px-10 lg:px-12 pb-10 text-gray-900 space-y-8">
              <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-full">
              <div className="lg:col-span-2 space-y-8">
                  <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
                  <CardContent className="p-6">
                      <h2 className="font-brand text-lg text-black font-semibold">Get Faster Reimbursements with Clario!</h2>
                      <p className="text-sm text-gray-600 mt-1">Your Amazon account has been connected successfully.</p>
                  </CardContent>
                </Card>

                  <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-brand text-lg text-black font-semibold">Your Recovered Value</h2>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="About recovered value"
                                  className="text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black text-white text-xs">
                              Your recovered profits from approved/completed claims. {recoverySource && `Source: ${recoverySource}`}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                          <div className="text-[24px] md:text-[28px] font-semibold mt-1 text-emerald-600">
                          {formatCurrency(recoveredTotal ?? 0, recoveredCurrency)}
                        </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            {submittedClaimsCount != null && submittedClaimsCount > 0 
                              ? `From ${submittedClaimsCount} claim${submittedClaimsCount !== 1 ? 's' : ''} submitted`
                              : 'From approved claims submitted'
                            }
                          </div>
                          {/* Sync status message */}
                          {(syncMessage || needsSync || syncTriggered) && (
                            <div className={`mt-3 px-3 py-2 rounded-md text-xs ${
                              syncTriggered 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : needsSync 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  {syncTriggered && <RefreshCw className="h-3 w-3 mt-0.5 animate-spin" />}
                                  <span>{syncMessage || (needsSync ? 'Syncing your Amazon account... Please refresh in a few moments.' : '')}</span>
                                </div>
                                {activeSyncId && (
                                  <button
                                    onClick={() => navigate(`/sync?id=${activeSyncId}`)}
                                    className="text-blue-600 hover:text-blue-700 underline text-xs ml-2"
                                  >
                                    View progress
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm">
                          <div className="text-xs text-gray-600">Next payment</div>
                          <div className="text-xl font-semibold text-black mt-1">
                            {formatCurrency((nextPaymentAmount ?? 0), recoveredCurrency)}
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            {nextPaymentDate
                              ? `Estimated on ${new Date(nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                              : 'No payout scheduled yet'}
                          </div>
                        <button
                          type="button"
                            className="text-xs text-indigo-600 mt-1 underline-offset-2 hover:underline"
                          onClick={() => navigate('/upcoming-payments')}
                          aria-label="View upcoming payments"
                        >
                          upcoming payments
                        </button>
                      </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm">
                          <div className="text-xs text-gray-600">Pending recovery</div>
                          <div className="text-xl font-semibold text-black mt-1">
                            {formatCurrency((pendingRecoveryAmount ?? 0), recoveredCurrency)}
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1">
                            No. of Claims: {effectivePendingClaims}
                          </div>
                          {hasPendingClaimsData && (
                            <div className="text-[11px] text-gray-600 mt-1">
                              {effectivePendingClaims === 1 ? '1 claim awaiting payout' : `${effectivePendingClaims} claims awaiting payout`}
                            </div>
                          )}
                          <div className="text-[11px] mt-1">
                            <span className="text-gray-600">Recovered so far: </span>
                            <span className="text-black">{formatCurrency(recoveredTotal ?? 0, recoveredCurrency)}</span>
                          </div>
                      </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="text-xs text-gray-600">Approved</div>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-500" />
                              <span className="text-[10px] text-red-500 font-medium">8%</span>
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-[10px] text-green-600 font-medium">92%</span>
                            </div>
                          </div>
                          <div className="text-xl font-semibold text-black mt-1">{formatCurrency(computedApproved ?? 0, recoveredCurrency)}</div>
                          <div className="text-[11px] mt-1">
                            <span className="text-gray-600">Total this month: </span>
                            <span className="text-black">$31.4K</span>
                        </div>
                      </div>
                    </div>


                    {/* Auto-Submit button removed per request */}
                  </CardContent>
                </Card>

                {/* Phase 3: Detection Summary Card */}
                {detectionStats && detectionStats.totalDetections > 0 && (
                  <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-brand text-lg text-black font-semibold">💰 Detected Claims</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                          onClick={() => navigate('/recoveries', { state: { filter: 'detected' } })}
                        >
                          View All →
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm">
                          <div className="text-xs text-gray-600">Total Detected</div>
                          <div className="text-xl font-semibold text-black mt-1">{detectionStats.totalDetections}</div>
                        </div>
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm">
                          <div className="text-xs text-gray-600">Recovery Potential</div>
                          <div className="text-xl font-semibold text-emerald-600 mt-1">
                            {formatCurrency(detectionStats.estimatedRecovery)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-600">⚡</span>
                          <span className="text-gray-700">High: <span className="font-semibold text-black">{detectionStats.highConfidence}</span> claims</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-amber-600">❓</span>
                          <span className="text-gray-700">Medium: <span className="font-semibold text-black">{detectionStats.mediumConfidence}</span> claims</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">📋</span>
                          <span className="text-gray-700">Low: <span className="font-semibold text-black">{detectionStats.lowConfidence}</span> claims</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                  <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-brand text-lg text-black font-semibold">Quick Actions</h2>
                        <button aria-label="Customize quick actions" className="text-gray-500 hover:text-gray-700" onClick={() => setQuickActionsEditOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {selectedQuickActions.includes('connect_evidence') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => setShowEvidencePrompt(true)}>
                          <Mail className="h-4 w-4" />
                          Connect evidence sources
                        </Button>
                      )}
                      {selectedQuickActions.includes('review_high_conf') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/recoveries', { state: { filter: 'high_confidence' } })}>
                          <CheckCircle className="h-4 w-4" />
                          Review high‑confidence cases
                        </Button>
                      )}
                      {selectedQuickActions.includes('resolve_new') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/recoveries', { state: { filter: 'new_pending' } })}>
                          <RotateCcw className="h-4 w-4" />
                          Resolve new opportunities
                        </Button>
                      )}
                      {selectedQuickActions.includes('run_detector') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={async () => {
                          try { await api.post('/api/detections/run'); toast({ title: 'Detector started', description: 'Scanning new opportunities…' }); } catch(e:any){ toast({ title: 'Detector failed', description: e?.message || 'Please try again.', variant: 'destructive' }); }
                        }}>
                          <RefreshCw className="h-4 w-4" />
                          Run detector
                        </Button>
                      )}
                      {selectedQuickActions.includes('ingest_now') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={async () => {
                          const r = await api.startEvidenceIngest();
                          if ((r as any)?.ok) toast({ title: 'Ingestion started', description: 'We will notify you when new docs arrive.' });
                          else toast({ title: 'Ingestion failed', description: (r as any)?.error || 'Try again.', variant: 'destructive' }); 
                        }}>
                          <Cloud className="h-4 w-4" />
                          Ingest documents now
                        </Button>
                      )}
                      {selectedQuickActions.includes('smart_sync') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/smart-inventory-sync')}>
                          <RefreshCw className="h-4 w-4" />
                          Smart Inventory Sync
                        </Button>
                      )}
                      {selectedQuickActions.includes('upcoming_payments') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/upcoming-payments')}>
                          <CircleDollarSign className="h-4 w-4" />
                          Upcoming payments
                        </Button>
                      )}
                      {selectedQuickActions.includes('export_history') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/export-center')}>
                          <Download className="h-4 w-4" />
                          Export recovery & payout history
                        </Button>
                      )}
                      {selectedQuickActions.includes('evidence_locker') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/evidence-locker')}>
                          <FileText className="h-4 w-4" />
                          Doc Locker
                        </Button>
                      )}
                      {selectedQuickActions.includes('invite_teammate') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => setInviteOpen(true)}>
                          <Link2 className="h-4 w-4" />
                          Invite a teammate
                        </Button>
                      )}
                      {selectedQuickActions.includes('configure_alerts') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/notifications')}>
                          <Bell className="h-4 w-4" />
                          Configure alerts
                        </Button>
                      )}
                      {selectedQuickActions.includes('security_setup') && (
                          <Button variant="outline" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-50" onClick={() => navigate('/settings')}>
                          <Shield className="h-4 w-4" />
                          Security quick setup
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

                <div className="lg:col-span-1">
                  <Card className="h-full bg-white border border-gray-200 text-gray-900 shadow-sm">
                    <CardContent className="p-0">
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-black">Recent Activity</h3>
                          <span className="text-xs rounded px-2 py-0.5 bg-gray-50 text-gray-700 border border-gray-200">4 new</span>
                        </div>
                      </div>
                      <div className="py-2 max-h-[600px] overflow-y-auto">
                        <div className="relative px-4 max-w-[360px] mx-auto text-[12px] divide-y divide-gray-200">
                          {(() => {
                            const events = [
                              { id: 'evt-0', unread: true, title: 'Claim Approved', details: 'Good news! Claim approved for $1,200 reimbursement.', time: 'Just now' },
                              { id: 'evt-1', unread: true, title: 'Connection Established', details: 'Amazon connection established', time: 'Just now' },
                              { id: 'evt-2', unread: true, title: 'Claims Identified', details: `23 potential claims identified, valued at ~${formatCurrency(14228)}` , time: '2 minutes ago' },
                              { id: 'evt-2.5', unread: true, title: 'Evidence Matched', details: 'Invoices and shipment records matched for 4 new claims.', time: 'Just now' },
                              { id: 'evt-3', unread: false, title: 'Claim Submitted', details: 'Auto-submitted 5 verified claims', time: 'Yesterday' },
                              { id: 'evt-4', unread: false, title: 'Funds Recovered', details: `Payout confirmed: ${formatCurrency(850.75)}`, time: '2 days ago' },
                            ];
                            return events.map((evt) => (
                              <div key={evt.id} className="group relative flex items-start gap-3 py-3 overflow-hidden">
                                <div className="pt-1">
                                  <span className={'inline-block h-2 w-2 rounded-full ' + (evt.unread ? 'bg-blue-500' : 'bg-gray-400')} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className={'text-[12px] truncate ' + (evt.unread ? 'text-black font-semibold' : 'text-gray-600 font-medium')}>{evt.title}</p>
                                    <span className={'ml-3 shrink-0 text-[11px] ' + (evt.unread ? 'text-gray-700 font-semibold' : 'text-gray-500')}>{evt.time}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">{evt.details}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                      <div className="border-t border-gray-200 p-4">
                        <Button className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200" onClick={() => navigate('/notifications')}>
                          View all messages
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              </div>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>
      {/* Evidence Connections Prompt on Dashboard as fallback */}
        <Dialog open={showEvidencePrompt} onOpenChange={setShowEvidencePrompt}>
          <DialogContent className="max-w-lg bg-white border border-gray-200 text-gray-900 shadow-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-black">
              Connect Doc Sources
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Link your email and cloud storage to automatically collect invoices, receipts, and shipping documents.
              <span className="block mt-2 text-sm text-gray-600">
                Read-only access. No writing or sending permissions.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
              <Button className="w-full bg-red-600 hover:bg-red-500 text-white border border-transparent shadow-sm" onClick={async () => {
              try {
                const r = await api.connectDocs('gmail');
                if (r.ok && r.data?.auth_url) {
                  window.location.href = r.data.auth_url;
                } else {
                  toast({
                    title: 'Connection Failed',
                    description: r.error || 'Failed to initiate Gmail connection. Please try again.',
                    variant: 'destructive',
                  });
                }
              } catch (error) {
                console.error('Failed to connect Gmail:', error);
                toast({
                  title: 'Connection Failed',
                  description: 'An error occurred while connecting Gmail. Please try again.',
                  variant: 'destructive',
                });
              }
            }}>
              <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 mr-2 object-contain" /> Gmail
            </Button>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('outlook');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Outlook connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Outlook:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Outlook. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 mr-2 object-contain" /> Outlook
            </Button>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('gdrive');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Google Drive connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Google Drive:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Google Drive. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/gd.png" alt="Google Drive" className="h-4 w-4 mr-2 object-contain" /> Google Drive
            </Button>
            <Button 
              className="w-full bg-sky-600 hover:bg-sky-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('dropbox');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Dropbox connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Dropbox:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Dropbox. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/db.png" alt="Dropbox" className="h-4 w-4 mr-2 object-contain" /> Dropbox
            </Button>
          </div>
            <DialogFooter>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-800" onClick={() => { setShowEvidencePrompt(false); try { localStorage.setItem('clario.evidencePromptDismissed', 'true'); } catch {} }}>Not now</Button>
                <Button onClick={() => setShowEvidencePrompt(false)} className="gap-2 bg-black hover:bg-gray-800 text-white border border-black">
              <ArrowRight className="h-4 w-4" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Quick Actions Editor */}
      <Dialog open={quickActionsEditOpen} onOpenChange={setQuickActionsEditOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200 text-gray-900 shadow-lg rounded-2xl">
          <DialogHeader>
              <DialogTitle className="text-lg text-black">Customize Quick Actions</DialogTitle>
              <DialogDescription className="text-gray-600">Select which actions to show.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {QUICK_ACTIONS.map(a => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-gray-900">
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
          <DialogFooter>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-800" onClick={() => setQuickActionsEditOpen(false)}>Cancel</Button>
            <Button className="bg-black hover:bg-gray-800 text-white border border-black" onClick={() => { try { localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions)); toast({ title: 'Saved', description: 'Quick actions updated.' }); } catch {} setQuickActionsEditOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite teammate dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite a Teammate</DialogTitle>
            <DialogDescription>Send a read‑only invite to finance/ops.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={async () => { if (!inviteEmail) return; try { await api.post('/api/team/invite', { email: inviteEmail }); toast({ title: 'Invite sent', description: inviteEmail }); } catch (e: any) { toast({ title: 'Invite failed', description: e?.message || 'Please try again.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
