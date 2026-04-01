import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { startSync, getSyncStatus, cancelSync, forceClearSync, subscribeSyncProgress, type SyncStatusResponse, type SSEConnectionState } from '@/lib/inventoryApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2, Search, Package, Truck, RotateCcw, DollarSign, Archive, Target, Clock, ChevronDown, ChevronRight, Download, Info } from 'lucide-react';
const GmailIcon = '/gmailicon.png';
const OutlookIcon = '/outlookicon.webp';
const GoogleDriveIcon = '/gd.png';
const DropboxIcon = '/Dropbox_Icon.svg.png';
import { useToast } from '@/hooks/use-toast';
import { useDetectionUpdates } from '@/hooks/use-detection-updates';
import { api } from '@/lib/api';

// Log entry type
interface LogEntry {
  id: string;
  timestamp: string | null;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress' | 'thinking';
  category: 'orders' | 'inventory' | 'shipments' | 'returns' | 'settlements' | 'fees' | 'claims' | 'detection' | 'system';
  message: string;
  count?: number;
  context?: {
    details?: string[];
    estimatedTime?: string;
  };
}

// Log story group - groups related backend logs into collapsible sections
interface LogStory {
  id: string;
  category: LogEntry['category'];
  title: string;
  logs: LogEntry[];
}

// Category icons
const getCategoryIcon = (category: LogEntry['category']) => {
  switch (category) {
    case 'orders': return <Package className="h-3.5 w-3.5" />;
    case 'inventory': return <Archive className="h-3.5 w-3.5" />;
    case 'shipments': return <Truck className="h-3.5 w-3.5" />;
    case 'returns': return <RotateCcw className="h-3.5 w-3.5" />;
    case 'settlements': return <DollarSign className="h-3.5 w-3.5" />;
    case 'fees': return <DollarSign className="h-3.5 w-3.5" />;
    case 'claims': return <Target className="h-3.5 w-3.5" />;
    case 'detection': return <Target className="h-3.5 w-3.5" />;
    case 'system': return <Clock className="h-3.5 w-3.5" />;
  }
};

export default function Sync() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  // Tenant priority: URL param > context > fallback
  const currentTenantSlug = urlTenantSlug || tenant?.slug || 'default';
  const urlSyncId = params.get('id') || undefined;
  const [syncId, setSyncId] = useState<string | undefined>(urlSyncId);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [message, setMessage] = useState<string>('Initializing sync...');
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncBlocked, setIsSyncBlocked] = useState(false); // Shows force-clear button
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const previousStatusRef = useRef<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const toastShownRef = useRef<{ started?: boolean; completed?: boolean; failed?: boolean; cancelled?: boolean }>({});
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const sourcesModalTimeoutRef = useRef<number | null>(null);
  const modalDismissedRef = useRef<boolean>(false); // Track if user dismissed modal for this sync session
  const [providerLoading, setProviderLoading] = useState<'gmail' | 'outlook' | 'gdrive' | 'dropbox' | null>(null);
  const [sseStatus, setSseStatus] = useState<SSEConnectionState>('disconnected'); // SSE connection status
  const sseStatusRef = useRef<SSEConnectionState>('disconnected');

  // Log system state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'money' | 'issues'>('all'); // Filter: All / Money / Issues
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set()); // Tracks COLLAPSED stories (inverted - empty = all open)
  const [logsFinished, setLogsFinished] = useState(false);
  const logsFinishedRef = useRef(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const nextLogIdRef = useRef(0);

  useEffect(() => {
    sseStatusRef.current = sseStatus;
  }, [sseStatus]);

  const appendBackendLog = (entry: Omit<LogEntry, 'id'>) => {
    setLogs(prev => [
      ...prev,
      {
        ...entry,
        id: `log_${nextLogIdRef.current++}`,
      },
    ]);
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Set progress to 100% when logs finish
  useEffect(() => {
    if (logsFinished && status === 'completed') {
      setProgress(100);
    }
  }, [logsFinished, status]);



  // Filter logs based on search AND category filter
  const filteredLogs = useMemo(() => {
    // First apply category filter
    let filtered = logs;

    if (logFilter === 'money') {
      // Money events: claims, reimbursements, discrepancies, potential value
      const moneyKeywords = ['claim', 'reimburse', 'recovery', 'discrepanc', 'mismatch', 'potential', 'value', 'amount', '$', 'fee', 'overcharge', 'refund', 'payout', 'anomal'];
      filtered = logs.filter(log => {
        const lowerMsg = log.message.toLowerCase();
        return moneyKeywords.some(k => lowerMsg.includes(k)) ||
          log.category === 'claims' ||
          log.type === 'success';
      });
    } else if (logFilter === 'issues') {
      // Issues: only actual errors and warnings by log type
      // NOT info logs that just mention the word "error" in context
      filtered = logs.filter(log =>
        log.type === 'error' ||
        log.type === 'warning'
      );
    }
    // 'all' keeps all logs

    // Then apply search filter
    if (!logSearch.trim()) return filtered;
    const searchLower = logSearch.toLowerCase();
    return filtered.filter(log =>
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  }, [logs, logSearch, logFilter]);

  // Group backend logs into collapsible story sections without derived summaries
  const logStories = useMemo((): LogStory[] => {
    const storyMap = new Map<LogEntry['category'], LogStory>();

    const storyConfig: Record<LogEntry['category'], { title: string }> = {
      inventory: { title: 'Inventory Scan' },
      orders: { title: 'Order Ledger Check' },
      shipments: { title: 'Shipment Verification' },
      returns: { title: 'Returns Analysis' },
      settlements: { title: 'Settlement Reconciliation' },
      fees: { title: 'Fee Audit' },
      claims: { title: 'Claim Detection' },
      detection: { title: 'Opportunity Detection' },
      system: { title: 'System' },
    };

    for (const log of filteredLogs) {
      const category = log.category;
      if (!storyMap.has(category)) {
        storyMap.set(category, {
          id: `story_${category}`,
          category,
          title: storyConfig[category].title,
          logs: [],
        });
      }

      storyMap.get(category)?.logs.push(log);
    }

    return Array.from(storyMap.values());
  }, [filteredLogs]);

  // Toggle story expansion
  const toggleStory = (storyId: string) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  // Show modal and toast only AFTER logs have finished displaying
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (logsFinished && status === 'completed') {
      // No toast here - the UI already shows completion status clearly

      // Show modal after a brief pause
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
      }
      sourcesModalTimeoutRef.current = window.setTimeout(() => {
        // Only show modal if user hasn't dismissed it for this sync session
        if (!modalDismissedRef.current) {
          setShowSourcesModal(true);
        }
      }, 1000); // Show modal 1s after logs finish
    } else if (status !== 'completed') {
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
        sourcesModalTimeoutRef.current = null;
      }
      setShowSourcesModal(false);
    }

    return () => {
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
        sourcesModalTimeoutRef.current = null;
      }
    };
  }, [logsFinished, status, toast, syncData]);

  // Phase 3: Detection updates SSE - connect when sync completes
  // NOTE: This hook ONLY updates syncData state - logs are already handled by main SSE handler
  // to avoid duplicate log messages
  useDetectionUpdates(
    status === 'completed' && syncId ? syncId : null,
    (event) => {
      // Handle detection updates - DON'T add logs here, main SSE handler does that
      if (event.status === 'complete') {
        const totalDetections = event.total_detections ?? null;
        const estimatedValue = event.estimated_value ?? event.totalRecoverableValue ?? null;

        if (totalDetections !== null && totalDetections > 0) {
          // ⭐ UPDATE syncData so "Potential Recovery Identified" shows when logsFinished
          // No addLog here - main SSE handler at line 500+ already handles logs
          setSyncData(prev => prev ? {
            ...prev,
            claimsDetected: totalDetections,
            totalRecoverableValue: estimatedValue ?? prev.totalRecoverableValue
          } : prev);
        }
      } else if (event.new_detections_count && event.new_detections_count > 0) {
        const estimatedValue = event.estimated_value ?? null;

        // ⭐ UPDATE syncData for incremental updates too
        // No addLog here - avoid duplicate logs
        setSyncData(prev => prev ? {
          ...prev,
          claimsDetected: (prev.claimsDetected ?? 0) + event.new_detections_count,
          totalRecoverableValue: estimatedValue !== null
            ? (prev.totalRecoverableValue ?? 0) + estimatedValue
            : prev.totalRecoverableValue
        } : prev);
      }
    }
  );

  const updateSyncState = (s: SyncStatusResponse) => {
    // Merge new state with previous, preserving claimsDetected and totalRecoverableValue
    // to avoid race condition where sync completion overwrites detection values
    setSyncData(prev => ({
      ...prev,
      ...s,
      // Preserve detection values if new event doesn't have them
      claimsDetected: s.claimsDetected ?? prev?.claimsDetected,
      totalRecoverableValue: s.totalRecoverableValue ?? prev?.totalRecoverableValue
    }));
    // Hold progress at 98% until logs finish, then show 100%
    if (typeof s.progress === 'number') {
      if (s.progress >= 100 && !logsFinished) {
        setProgress(98); // Hold at 98% while logs are still displaying
      } else {
        setProgress(s.progress);
      }
    }
    if (s.message) setMessage(s.message);

    // Map status values to match documentation
    let mappedStatus: 'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled' = 'idle';
    if (s.status === 'idle') mappedStatus = 'idle';
    else if (s.status === 'running') mappedStatus = 'running';
    else if (s.status === 'detecting') mappedStatus = 'detecting';
    else if (s.status === 'completed' || s.status === 'complete') mappedStatus = 'completed';
    else if (s.status === 'failed') mappedStatus = 'failed';
    else if (s.status === 'cancelled') mappedStatus = 'cancelled';

    // Show toast notifications on status changes
    if (mappedStatus !== previousStatusRef.current) {
      previousStatusRef.current = mappedStatus;

      // Show toast for status transitions
      if (mappedStatus === 'completed' && !toastShownRef.current.completed) {
        toastShownRef.current.completed = true;
        logsFinishedRef.current = true;
        setLogsFinished(true);
      } else if (mappedStatus === 'failed' && !toastShownRef.current.failed) {
        toastShownRef.current.failed = true;
        toast({
          title: 'Amazon Update Paused',
          description: s.error || s.message || 'Sync failed.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        toastShownRef.current.cancelled = true;
        toast({
          title: 'Sync Cancelled',
          description: s.message || 'The sync has been cancelled.',
          duration: 4000,
        });
      }
    }

    setStatus(mappedStatus);

    if (s.error || mappedStatus === 'failed') {
      setError(s.error || s.message || null);
    } else {
      setError(null);
    }
  };

  // Sync syncId state with URL params (only update when URL changes)
  useEffect(() => {
    setSyncId(urlSyncId);
  }, [urlSyncId]);

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;
    let unsubscribe: (() => void) | null = null;

    async function ensureSync() {
      if (!syncId) {
        try {
          // Clear logs and reset state for new sync
          setLogs([]);
          setLogsFinished(false);
          modalDismissedRef.current = false; // Reset modal dismissed flag for new sync
          logsFinishedRef.current = false;

          const start = await startSync(currentTenantSlug);
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };

          toast({
            title: 'Amazon Update Started',
            description: 'We\'re pulling your latest Amazon records. This can take a few minutes.',
            duration: 4000,
          });

          navigate(`/sync?id=${newSyncId}`, { replace: true });
        } catch (e: any) {
          if (cancelled) return;
          const errorMsg = e?.message || 'Failed to start sync';

          // Check if it's a "sync already in progress" error
          const isBlockedError = errorMsg.toLowerCase().includes('already in progress');

          setStatus('failed');
          setMessage(errorMsg);
          setError(errorMsg);
          setIsSyncBlocked(isBlockedError);
          previousStatusRef.current = 'failed';

          toast({
            title: isBlockedError ? 'Sync Blocked' : 'Failed to Start Sync',
            description: isBlockedError
              ? 'A previous sync is stuck. Use "Clear & Retry" to fix this.'
              : errorMsg,
            variant: 'destructive',
            duration: 5000,
          });
          return;
        }
      } else {
        // Load existing sync status
        try {
          const s = await getSyncStatus(syncId, currentTenantSlug);
          if (cancelled) return;

          console.log('[Sync] Received sync status:', s);
          updateSyncState(s);
        } catch (e: any) {
          if (cancelled) return;
          console.error('Failed to load sync status:', e);
          const errorMessage = e?.message || 'Failed to load sync status';

          if (errorMessage.includes('not found') || errorMessage.includes('Sync not found')) {
            setSyncId(undefined);
            setSyncData(null);
            setStatus('idle');
            setProgress(0);
            setMessage('Sync not found. Please start a new sync.');
            setError(null);
            navigate(tenantRoute(currentTenantSlug, '/sync'), { replace: true });

            toast({
              title: 'Sync Not Found',
              description: 'The sync you were viewing no longer exists. Please start a new sync.',
              duration: 5000,
            });
          } else {
            setError(errorMessage);
            toast({
              title: 'Error Loading Sync Status',
              description: errorMessage || 'Failed to load sync status. Please refresh the page.',
              variant: 'destructive',
              duration: 5000,
            });
          }
        }
      }
    }

    ensureSync();

    // Prefer SSE realtime; fall back to polling if EventSource fails
    if (syncId) {
      try {
        unsubscribe = subscribeSyncProgress(syncId, (s: any) => {
          if (cancelled) return;

          // Handle log events from backend
          if (s.type === 'log' && s.log) {
            console.log('[Sync] Log event received:', s.log);
            appendBackendLog({
              type: s.log.type || 'info',
              category: s.log.category || 'system',
              message: s.log.message,
              count: s.log.count,
              context: s.log.context,
              timestamp: typeof s.log.timestamp === 'string' ? s.log.timestamp : null,
            });
            return;
          }

          // Handle detection.completed event (sent after sync completes)
          if (s.type === 'detection' && s.status === 'completed') {
            console.log('[Sync] Detection completed event received:', s);
            const detectedCount = s.claimsDetected ?? null;
            const estimatedValue = s.totalRecoverableValue ?? null;

            // ⭐ UPDATE syncData - but DON'T show toast here, let the main completion flow handle it
            setSyncData(prev => prev ? {
              ...prev,
              claimsDetected: detectedCount ?? prev.claimsDetected,
              totalRecoverableValue: estimatedValue ?? prev.totalRecoverableValue
            } : prev);
            return;
          }

          updateSyncState(s);

          if (s.status === 'failed' || s.status === 'cancelled') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        }, (connectionState) => {
          // SSE connection state callback
          setSseStatus(connectionState);
        }, currentTenantSlug);
      } catch (err) {
        console.error('SSE connection failed, falling back to polling:', err);
      }
    }

    // Polling fallback - continue polling after completion to catch async detection results
    let pollsAfterComplete = 0;
    const MAX_POLLS_AFTER_COMPLETE = 12; // 12 polls × 3s = 36 seconds for detection to complete

    interval = setInterval(async () => {
      if (!syncId || cancelled) return;
      if (sseStatusRef.current === 'connected') return;
      try {
        const s = await getSyncStatus(syncId, currentTenantSlug);
        if (cancelled) return;
        updateSyncState(s);

        if (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled') {
          pollsAfterComplete++;

          if (pollsAfterComplete >= MAX_POLLS_AFTER_COMPLETE || s.status === 'failed' || s.status === 'cancelled') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (err?.message?.includes('not found') || err?.message?.includes('Sync not found')) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          setSyncId(undefined);
          setSyncData(null);
          setStatus('idle');
          setProgress(0);
          setMessage('Sync not found. Please start a new sync.');
          navigate('/sync', { replace: true });
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from SSE:', err);
        }
      }
    };
  }, [syncId, navigate, currentTenantSlug]);

  const handleCancelSync = async () => {
    if (!syncId || status !== 'running') return;

    setIsCancelling(true);
    try {
      await cancelSync(syncId, currentTenantSlug);
      setStatus('cancelled');
      setMessage('Sync cancelled');
      previousStatusRef.current = 'cancelled';
      toastShownRef.current.cancelled = true;

      toast({
        title: 'Sync Cancelled',
        description: 'The sync has been cancelled successfully.',
        duration: 4000,
      });

      const s = await getSyncStatus(syncId, currentTenantSlug);
      updateSyncState(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel sync');
      toast({
        title: 'Failed to Cancel Sync',
        description: e?.message || 'Failed to cancel sync. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetry = () => {
    setSyncId(undefined);
    setProgress(0);
    setStatus('idle');
    setMessage('Initializing sync...');
    setError(null);
    setSyncData(null);
    setLogs([]);
    setLogsFinished(false);
    logsFinishedRef.current = false;
    previousStatusRef.current = 'idle';
    toastShownRef.current = {};

    toast({
      title: 'Retrying Sync',
      description: 'Starting a new sync...',
      duration: 3000,
    });

    window.location.reload();
  };

  // Force clear stuck syncs and retry
  const handleForceClear = async () => {
    setIsClearing(true);

    try {
      const result = await forceClearSync(currentTenantSlug);

      toast({
        title: 'Sync Cleared',
        description: result.message,
        duration: 3000,
      });

      // Reset state and start new sync
      setIsSyncBlocked(false);
      setError(null);
      setSyncId(undefined);
      setStatus('idle');
      setProgress(0);

      // Small delay then reload to start fresh sync
      setTimeout(() => {
        navigate(tenantRoute(currentTenantSlug, '/sync'), { replace: true });
      }, 500);
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to clear stuck sync';
      setError(errorMsg);

      toast({
        title: 'Failed to Clear',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Export logs as styled HTML (printable as PDF) for support tickets
  const exportLogs = () => {
    const exportDate = new Date().toLocaleString();

    const logRows = logs.map(log => {
      const time = log.timestamp ?? 'timestamp unavailable';
      const typeColor = log.type === 'error' ? '#dc2626' : log.type === 'warning' ? '#d97706' : log.type === 'success' ? '#059669' : '#6b7280';
      return `<tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${time}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: ${typeColor}; font-weight: 600; text-transform: uppercase;">${log.type}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #374151;">${log.category}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #111827;">${log.message}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Margin | Sync Logs - ${exportDate}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #111827; font-size: 24px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .meta span { margin-right: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { padding: 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="margin-bottom: 20px;">
    <img src="/logoimagetwo.png" alt="Margin Logo" style="height: 48px; object-fit: contain;" />
  </div>
  <div class="meta">
    <span><strong>Exported:</strong> ${exportDate}</span>
    <span><strong>Sync ID:</strong> ${syncId || 'N/A'}</span>
    <span><strong>Status:</strong> ${status}</span>
    <span><strong>Total Entries:</strong> ${logs.length}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 160px;">Timestamp</th>
        <th style="width: 80px;">Type</th>
        <th style="width: 100px;">Category</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>${logRows}</tbody>
  </table>
  <p style="margin-top: 24px; font-size: 11px; color: #9ca3af;">
    To save as PDF: Press Ctrl+P (Cmd+P on Mac) → Select "Save as PDF" as destination → Click Save
  </p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    toast({
      title: 'Logs Exported',
      description: 'Logs opened in new tab. Press Ctrl+P to save as PDF.',
      duration: 5000,
    });
  };

  const formatLogTimestamp = (timestamp: string | null | undefined): { short: string; full?: string } => {
    if (!timestamp) {
      return { short: 'timestamp unavailable' };
    }

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return { short: 'timestamp unavailable' };
    }

    return {
      short: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: parsed.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
    };
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-neutral-500';
      case 'warning':
        return 'text-neutral-500';
      case 'success':
        return 'text-neutral-200';
      case 'income':
      case 'money':
        return 'text-white';
      case 'thinking':
        return 'text-neutral-600 italic';
      default:
        return 'text-neutral-400';
    }
  };

  // Helper for screenshot-style date formatting: YYYY/MM/DD, HH:MM:SS
  const formatDateTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const date = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${date}, ${time}`;
  };

  return (
    <PageLayout title="Sync Statistics" hideNavbar hideSidebar midnight hideLogo logoFontFamily='"Nunito Sans", sans-serif'>
      <div className="relative min-h-[90vh] overflow-hidden">
        {/* Background Mesh Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto space-y-8 pt-12 md:pt-16">
          {/* Page Header - Screenshot Redesign - Aligned with Activity Log */}
          <div className="mb-12 max-w-4xl mx-auto md:mx-auto lg:mx-auto">
            <div className="flex items-start justify-between">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight font-merriweather">Financial Audit Engine</h1>
                  <p className="text-[13px] text-white/40 mt-1 font-normal font-montserrat">Powered by Amazon SP-API</p>
                </div>
              </div>

              {/* Polling Status - Top Right */}
              {status === 'running' && (
                <div className="pt-8">
                  <div className="flex items-center gap-2">
                    {sseStatus === 'connected' ? (
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-500/80">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        SYNC_ACTIVE
                      </span>
                    ) : (
                      <span className="text-[13px] font-medium text-white/40 font-mono">POLLING_STATE</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto md:mx-auto lg:mx-auto space-y-4">
            {/* Add shimmer animation to global styles */}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>

            {/* Main Content */}
            <div className="space-y-4">
              {/* Detecting Phase - OpenAI minimal style */}
              {status === 'detecting' && (
                <div className="py-6 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <div>
                      <p className="text-[16px] font-bold text-white tracking-tight">Scanning for discrepancies</p>
                      <p className="text-[13px] text-white/40 mt-1 font-normal font-montserrat">Our AI agents are auditing every transaction in real-time.</p>
                    </div>
                  </div>
                </div>
              )}


              {/* Status Strip - OpenAI minimal style */}
              {logs.length > 0 && status === 'completed' && (
                <div className="flex items-center gap-4 text-[13px]">
                  {syncData?.completedAt && (
                    <span className="text-gray-400 font-normal">
                      Last sync: {(() => {
                        const completedTime = new Date(syncData.completedAt).getTime();
                        const now = Date.now();
                        const diffMs = now - completedTime;
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        if (diffMins < 1) return 'just now';
                        if (diffMins < 60) return `${diffMins} min ago`;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        return `${diffHours}h ago`;
                      })()}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[16px] font-bold text-white tracking-tight font-merriweather">Activity Log</h4>
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-white/20 hover:text-white transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[#0A0A0A] border-white/10 text-neutral-200 p-4 max-w-[320px] shadow-2xl ml-2 rounded-none">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="font-bold text-white text-xs tracking-tight uppercase font-mono">Agent Activity</p>
                              <p className="text-sm leading-relaxed text-white/40 font-normal font-montserrat">
                                This agent performs a continuous forensic audit of your Amazon SP-API data—cross-referencing inventory movements, shipments, returns, reimbursements, fees, and claims across 26 detection models.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-xs text-white/20 italic font-mono">
                                Updates real-time via SP-API
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-[11px] text-white/20 font-mono tracking-widest font-bold">{filteredLogs.length} ENTRIES</span>
                </div>

                {/* Filter Toggles & Export */}
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <div className="flex items-center gap-10">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`pb-3 text-[11px] font-bold uppercase font-mono tracking-widest transition-all relative ${logFilter === 'all'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      All Events
                      {logFilter === 'all' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-emerald-500" />}
                    </button>
                    <button
                      onClick={() => setLogFilter('money')}
                      className={`pb-3 text-[11px] font-bold uppercase font-mono tracking-widest transition-all relative ${logFilter === 'money'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      Recoveries
                      {logFilter === 'money' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-emerald-500" />}
                    </button>
                    <button
                      onClick={() => setLogFilter('issues')}
                      className={`pb-3 text-[11px] font-bold uppercase font-mono tracking-widest transition-all relative ${logFilter === 'issues'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      Anomalies
                      {logFilter === 'issues' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-emerald-500" />}
                    </button>
                  </div>

                  {/* Export Button */}
                  {logs.length > 0 && (
                    <button
                      onClick={exportLogs}
                      className="pb-3 flex items-center gap-2 text-[11px] font-bold text-white/20 hover:text-white transition-all uppercase font-mono tracking-widest">
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </button>
                  )}
                </div>

              </div>

              {/* Search Bar - Clean minimal design */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                <Input
                  type="text"
                  placeholder="QUERY_ACTIVITY_FEED..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-11 h-12 text-[12px] font-mono bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-white/10 rounded-none placeholder:text-white/10 text-white shadow-none transition-all uppercase tracking-widest"
                />
              </div>

              {/* Log Container - Institutional Dark Theme */}
              <div className="relative group">
                {/* Header bar - OpenAI minimal terminal */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-[#0A0A0A] rounded-t-none border-b border-white/5 flex items-center px-5 z-10">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] font-mono">Stream: Activity_Feed</span>
                </div>


                <div
                  ref={logContainerRef}
                  data-lenis-prevent
                  className="bg-[#050505] rounded-none pt-14 pb-6 px-5 font-normal text-[13px] h-[500px] overflow-y-auto overscroll-contain scroll-smooth border border-white/5 shadow-2xl relative leading-relaxed tracking-tight text-white/40">
                  {/* Simplified subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none rounded-lg"></div>

                  {filteredLogs.length === 0 ? (
                    <div className="text-gray-400 flex flex-col items-center justify-center h-full relative z-10">
                      {logFilter === 'issues' ? (
                        <>
                          <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                          <span className="text-xs opacity-40">NO BACKEND ISSUE LOGS AVAILABLE</span>
                          <span className="text-xs text-gray-500 mt-1">Warnings and errors will appear here only when the backend emits them</span>
                        </>
                      ) : logFilter === 'money' ? (
                        <>
                          <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                          <span className="text-xs opacity-40">NO BACKEND RECOVERY LOGS AVAILABLE</span>
                          <span className="text-xs text-gray-500 mt-1">Recovery-related backend log entries will appear here if they are emitted</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                          <span className="text-xs opacity-40">NO BACKEND LOG ENTRIES AVAILABLE</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 relative z-10">
                      {logStories.map((story) => {
                        // Default to OPEN - users can close if they want
                        // expandedStories now tracks COLLAPSED stories (inverted logic)
                        const isExpanded = !expandedStories.has(story.id);

                        // Highlight function for log content - OpenAI monochrome style
                        const highlightContent = (text: string) => {
                          const parts = text.split(/(\$[\d,]+\.?\d*|\b\d+\b|\[.*?\])/g);
                          return parts.map((part, i) => {
                            if (part.match(/^\$[\d,]+\.?\d*$/)) {
                              return <span key={i} className="text-white font-medium">{part}</span>;
                            }
                            if (part.match(/^\d+$/)) {
                              return <span key={i} className="text-neutral-300">{part}</span>;
                            }
                            if (part.match(/^\[.*?\]$/)) {
                              return (
                                <span key={i} className="text-neutral-400 text-sm border border-neutral-800 px-1 rounded-sm tracking-tighter">
                                  {part.replace(/\[|\]/g, '')}
                                </span>
                              );
                            }
                            return part;
                          });
                        };

                        return (
                          <div key={story.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                            {/* Story Header - Clickable */}
                            <button
                              onClick={() => toggleStory(story.id)}
                              className="w-full text-left flex items-center gap-2.5 py-2 px-3 rounded-none hover:bg-white/[0.02] transition-colors group">
                              {/* Expand/Collapse Icon */}
                              <span className="text-white/20 group-hover:text-white transition-colors">
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </span>

                              <span className="text-white/30">
                                {getCategoryIcon(story.category)}
                              </span>

                              {/* Title */}
                              <span className="font-bold text-white text-[10px] uppercase tracking-widest font-mono">{story.title}</span>
                            </button>

                            {/* Expanded Log Details */}
                            {isExpanded && (
                              <div className="ml-5 pl-4 border-l border-neutral-900 mt-1 space-y-0.5">
                                {story.logs.map((log, index) => {
                                  const formattedTimestamp = formatLogTimestamp(log.timestamp);

                                  return (
                                    <React.Fragment key={log.id}>
                                      <div
                                        className={`flex items-start gap-4 py-2 px-3 text-[12px] font-mono border-b border-white/[0.02] last:border-0 ${log.type === 'thinking' ? 'opacity-20 italic' : ''}`}>
                                        {/* Timestamp - very subtle */}
                                        <span
                                          className="hidden sm:inline text-white/10 shrink-0 text-[10px] font-bold tracking-tighter"
                                          title={formattedTimestamp.full || formattedTimestamp.short}>
                                          {formattedTimestamp.short}
                                        </span>

                                        {/* Message */}
                                        <span className={`${getLogColor(log.type)} break-all flex-1`}>
                                          {highlightContent(log.message)}
                                          {index === story.logs.length - 1 && (status === 'running' || status === 'detecting') && (
                                            <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                          )}
                                        </span>
                                      </div>
                                      {/* Render context.details if present */}
                                      {log.context?.details && log.context.details.length > 0 && (
                                        <div className="ml-12 mt-1 mb-2 space-y-0.5 text-sm text-gray-300">
                                          {log.context.details.map((detail, i) => (
                                            <div key={i} className={detail.startsWith('✅') ? 'text-emerald-400' : ''}>
                                              {detail}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            )
                            }
                          </div>
                        );
                      })}

                      {/* Scroll anchor */}
                      <div className="h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Redesigned Bottom Section - Screenshot match */}
          <div className="pt-16 pb-12">
            <div className="flex flex-col gap-8">
              {/* Syncing Indicator - Top Right of bottom section */}
              <div className="flex justify-end pr-4">
                {status === 'running' ? (
                  <div className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-none">
                    <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                    <span className="text-[12px] font-bold text-white uppercase tracking-[0.2em] font-mono">Sync_Active</span>
                  </div>
                ) : (
                  <Button
                    onClick={async () => {
                      try {
                        // Clear logs and reset state successfully
                        setLogs([]);
                        setLogsFinished(false);
                        logsFinishedRef.current = false;
                        setStatus('idle');
                        setSyncId(undefined);
                        setError(null);

                        const start = await startSync(currentTenantSlug);
                        const newSyncId = start.syncId;
                        setSyncId(newSyncId);
                        setStatus('running');
                        setMessage(start.message || 'Sync started successfully');
                        previousStatusRef.current = 'running';
                        toastShownRef.current = { started: true };

                        toast({
                          title: 'Amazon Update Started',
                          description: 'We\'re pulling your latest Amazon records. This can take a few minutes.',
                          duration: 4000,
                        });

                        navigate(`/sync?id=${newSyncId}`, { replace: true });
                      } catch (e: any) {
                        setStatus('failed');
                        setMessage(e?.message || 'Failed to start sync');
                        setError(e?.message || 'Failed to start sync');
                        toast({
                          title: 'Amazon Update Paused',
                          description: e?.message || 'We could not start your Amazon sync. Please try again.',
                          variant: 'destructive',
                          duration: 5000,
                        });
                      }
                    }}
                    className="bg-white hover:bg-white/90 text-black font-bold px-8 py-4 rounded-none h-12 text-[10px] uppercase font-mono tracking-widest shadow-2xl transition-all">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    PROBE_DATA_AGAIN
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Error Message - Sophisticated Minimal Style */}
                {error && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 mb-6">
                    <div className="bg-neutral-50/50 border border-neutral-100 rounded-2xl p-6 flex items-start gap-4">
                      <div className="h-2 w-2 rounded-full bg-neutral-900 mt-2 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[13px] font-medium text-neutral-900 uppercase tracking-wider">System Interruption</p>
                        <p className="text-[16px] text-neutral-500 font-normal leading-relaxed"> {error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unified Timestamps */}
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/20 font-bold uppercase font-mono tracking-widest">
                  {syncData?.startedAt && (
                    <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> Started: {formatDateTime(syncData.startedAt)}</span>
                  )}
                  {syncData?.completedAt && (
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500/50" /> Completed: {formatDateTime(syncData.completedAt)}</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  {status === 'running' ? (
                    <button
                      onClick={handleCancelSync}
                      disabled={isCancelling}
                      className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase font-mono tracking-widest rounded-none transition-all border border-white/5 shadow-2xl disabled:opacity-50">
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-[18px] w-[18px] text-white/40" />
                      )}
                      ABORT_SYNC
                    </button>
                  ) : (status === 'failed' || status === 'cancelled') ? (
                    <>
                      {isSyncBlocked ? (
                        <button
                          onClick={handleForceClear}
                          disabled={isClearing}
                          className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase font-mono tracking-widest rounded-none transition-all border border-white/5 shadow-2xl disabled:opacity-50">
                          {isClearing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-[18px] w-[18px] text-white/40" />
                          )}
                          FORCE_RETRY
                        </button>
                      ) : (
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase font-mono tracking-widest rounded-none transition-all border border-white/5 shadow-2xl">
                          <RefreshCw className="h-[18px] w-[18px] text-white/40" />
                          REINITIALIZE
                        </button>
                      )}
                    </>
                  ) : null}

                  {/* Dashboard Button */}
                  <button
                    onClick={() => status === 'completed' && navigate(`/app/${currentTenantSlug}/dashboard`)}
                    disabled={status !== 'completed'}
                    className={`px-8 py-3 text-[11px] font-bold uppercase font-mono tracking-widest rounded-none transition-all ${status === 'completed'
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5 shadow-2xl'
                      : 'text-white/10 cursor-not-allowed bg-transparent'
                      }`}>
                    DASHBOARD_GO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Complete Modal */}
          <Dialog
            open={showSourcesModal}
            onOpenChange={(open) => {
              if (!open) {
                // User dismissed the modal (clicked X or outside)
                modalDismissedRef.current = true;
              }
              setShowSourcesModal(open);
            }}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-white/5 rounded-none shadow-2xl bg-[#050505]">
              <DialogHeader className="px-6 py-8 bg-[#0A0A0A] border-b border-white/5">
                <DialogTitle className="text-[10px] font-bold text-white uppercase tracking-[0.3em] font-mono">
                  ACTION_REQUIRED: CONNECT_DOCUMENT_SOURCES
                </DialogTitle>
                <DialogDescription className="text-[12px] text-white/40 mt-2 font-medium font-montserrat leading-relaxed">
                  Authorized access required for deep forensic document ingestion.
                </DialogDescription>
              </DialogHeader>

              <div className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      try {
                        setProviderLoading('gmail');
                        const r = await api.connectDocs('gmail', currentTenantSlug);
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-none disabled:opacity-50">
                    {providerLoading === 'gmail' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={GmailIcon} alt="Gmail" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase tracking-widest font-mono">Gmail</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        setProviderLoading('outlook');
                        const r = await api.connectDocs('outlook', currentTenantSlug);
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-none disabled:opacity-50">
                    {providerLoading === 'outlook' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={OutlookIcon} alt="Outlook" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase tracking-widest font-mono">Outlook</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        setProviderLoading('gdrive');
                        const r = await api.connectDocs('gdrive', currentTenantSlug);
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-none disabled:opacity-50">
                    {providerLoading === 'gdrive' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={GoogleDriveIcon} alt="Google Drive" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase tracking-widest font-mono">Drive</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        setProviderLoading('dropbox');
                        const r = await api.connectDocs('dropbox', currentTenantSlug);
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-none disabled:opacity-50">
                    {providerLoading === 'dropbox' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={DropboxIcon} alt="Dropbox" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase tracking-widest font-mono">Dropbox</span>
                  </button>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-[#0A0A0A] flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSourcesModal(false)}
                  className="text-[10px] text-white/20 hover:text-white hover:bg-transparent font-bold uppercase tracking-widest font-mono transition-colors">
                  SKIP_FOR_NOW
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout >
  );
}
