import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { startSync, getSyncStatus, cancelSync, forceClearSync, getRecentSseEvents, subscribeSyncProgress, type RecentSSEEvent, type SyncStatusResponse, type SSEConnectionState } from '@/lib/inventoryApi';
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

const LOG_DUPLICATE_WINDOW_MS = 1500;

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
  const [message, setMessage] = useState<string>('Preparing your audit...');
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncBlocked, setIsSyncBlocked] = useState(false); // Shows force-clear button
  const [amazonReady, setAmazonReady] = useState<boolean | null>(null);
  const [amazonConnectionMessage, setAmazonConnectionMessage] = useState<string | null>(null);
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

  const readEventString = (value: unknown): string | null => {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  };

  const extractEventSyncId = (event: unknown): string | null => {
    if (!event || typeof event !== 'object') {
      return null;
    }

    const record = event as Record<string, unknown>;
    const payload = record.payload && typeof record.payload === 'object'
      ? record.payload as Record<string, unknown>
      : null;
    const log = record.log && typeof record.log === 'object'
      ? record.log as Record<string, unknown>
      : null;

    return (
      readEventString(record.syncId) ||
      readEventString(record.sync_id) ||
      readEventString(payload?.syncId) ||
      readEventString(payload?.sync_id) ||
      readEventString(log?.syncId) ||
      readEventString(log?.sync_id)
    );
  };

  const warnIgnoredForeignEvent = (reason: string, currentSyncId: string, event: unknown) => {
    if (!import.meta.env.DEV) return;

    const record = event && typeof event === 'object'
      ? event as Record<string, unknown>
      : {};
    const log = record.log && typeof record.log === 'object'
      ? record.log as Record<string, unknown>
      : null;

    console.warn('[Sync] Ignored SSE event outside current run', {
      reason,
      currentSyncId,
      incomingSyncId: extractEventSyncId(event),
      eventType: readEventString(record.event_type) || readEventString(record.type) || 'unknown',
      status: readEventString(record.status),
      category: readEventString(log?.category) || readEventString(record.category),
    });
  };

  const extractEventTenantSlug = (event: unknown): string | null => {
    if (!event || typeof event !== 'object') {
      return null;
    }

    const record = event as Record<string, unknown>;
    const payload = record.payload && typeof record.payload === 'object'
      ? record.payload as Record<string, unknown>
      : null;

    return (
      readEventString(record.tenant_slug) ||
      readEventString(record.tenantSlug) ||
      readEventString(payload?.tenant_slug) ||
      readEventString(payload?.tenantSlug) ||
      readEventString(payload?.slug)
    );
  };

  const normalizeLogType = (value: string | null): LogEntry['type'] => {
    switch (value) {
      case 'success':
      case 'warning':
      case 'error':
      case 'progress':
      case 'thinking':
        return value;
      default:
        return 'info';
    }
  };

  const normalizeLogCategory = (value: string | null): LogEntry['category'] => {
    switch (value) {
      case 'orders':
      case 'inventory':
      case 'shipments':
      case 'returns':
      case 'settlements':
      case 'fees':
      case 'claims':
      case 'detection':
        return value;
      default:
        return 'system';
    }
  };

  const normalizeLogContext = (value: unknown): LogEntry['context'] | undefined => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const details = Array.isArray(record.details)
      ? record.details.filter((detail): detail is string => typeof detail === 'string' && detail.trim().length > 0)
      : undefined;
    const estimatedTime = readEventString(record.estimatedTime);

    if ((!details || details.length === 0) && !estimatedTime) {
      return undefined;
    }

    return {
      ...(details && details.length > 0 ? { details } : {}),
      ...(estimatedTime ? { estimatedTime } : {}),
    };
  };

  const extractBackendTimestamp = (event: unknown, log?: Record<string, unknown> | null): string | null => {
    if (!event || typeof event !== 'object') {
      return readEventString(log?.timestamp);
    }

    const record = event as Record<string, unknown>;
    const payload = record.payload && typeof record.payload === 'object'
      ? record.payload as Record<string, unknown>
      : null;

    return (
      readEventString(log?.timestamp) ||
      readEventString(record.timestamp) ||
      readEventString(payload?.timestamp)
    );
  };

  const mapEventToLogEntry = (event: unknown): Omit<LogEntry, 'id'> | null => {
    if (!event || typeof event !== 'object') {
      return null;
    }

    const record = event as Record<string, unknown>;
    const payload = record.payload && typeof record.payload === 'object'
      ? record.payload as Record<string, unknown>
      : null;
    const log = record.log && typeof record.log === 'object'
      ? record.log as Record<string, unknown>
      : payload?.log && typeof payload.log === 'object'
        ? payload.log as Record<string, unknown>
        : null;
    const eventType = readEventString(record.type) || readEventString(payload?.type);
    const message = readEventString(log?.message);

    if (eventType !== 'log' || !log || !message) {
      return null;
    }

    const countValue = typeof log.count === 'number'
      ? log.count
      : typeof log.count === 'string' && log.count.trim().length > 0 && Number.isFinite(Number(log.count))
        ? Number(log.count)
        : undefined;
    const context = normalizeLogContext(log.context);

    return {
      type: normalizeLogType(readEventString(log.type)),
      category: normalizeLogCategory(readEventString(log.category)),
      message,
      ...(typeof countValue === 'number' ? { count: countValue } : {}),
      ...(context ? { context } : {}),
      timestamp: extractBackendTimestamp(event, log),
    };
  };

  const parseLogTimestamp = (timestamp: string | null | undefined): number | null => {
    if (!timestamp) {
      return null;
    }

    const parsed = new Date(timestamp).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  };

  const areEquivalentLogs = (existing: LogEntry, candidate: Omit<LogEntry, 'id'>): boolean => {
    const existingDetails = existing.context?.details || [];
    const candidateDetails = candidate.context?.details || [];

    if (
      existing.type !== candidate.type ||
      existing.category !== candidate.category ||
      existing.message !== candidate.message ||
      (existing.count ?? null) !== (candidate.count ?? null) ||
      existing.context?.estimatedTime !== candidate.context?.estimatedTime ||
      existingDetails.length !== candidateDetails.length ||
      existingDetails.some((detail, index) => detail !== candidateDetails[index])
    ) {
      return false;
    }

    const existingTimestamp = parseLogTimestamp(existing.timestamp);
    const candidateTimestamp = parseLogTimestamp(candidate.timestamp);

    if (existingTimestamp === null || candidateTimestamp === null) {
      return existing.timestamp === candidate.timestamp;
    }

    return Math.abs(existingTimestamp - candidateTimestamp) <= LOG_DUPLICATE_WINDOW_MS;
  };

  const sortLogsByBackendTimestamp = (entries: LogEntry[]): LogEntry[] => {
    return [...entries].sort((left, right) => {
      const leftTimestamp = parseLogTimestamp(left.timestamp);
      const rightTimestamp = parseLogTimestamp(right.timestamp);

      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
      }

      if (leftTimestamp === null && rightTimestamp !== null) {
        return 1;
      }

      if (leftTimestamp !== null && rightTimestamp === null) {
        return -1;
      }

      return Number(left.id.replace('log_', '')) - Number(right.id.replace('log_', ''));
    });
  };

  const mergeLogEntries = (entries: Array<Omit<LogEntry, 'id'>>) => {
    if (entries.length === 0) {
      return;
    }

    setLogs(prev => {
      const merged = [...prev];

      for (const entry of entries) {
        if (merged.some(existing => areEquivalentLogs(existing, entry))) {
          continue;
        }

        merged.push({
          ...entry,
          id: `log_${nextLogIdRef.current++}`,
        });
      }

      return sortLogsByBackendTimestamp(merged);
    });
  };

  const resetLogTimeline = () => {
    nextLogIdRef.current = 0;
    setLogs([]);
  };

  const checkAmazonConnection = async (): Promise<boolean> => {
    try {
      const response = await api.getIntegrationStatus(currentTenantSlug);
      if (!response.ok || !response.data) {
        setAmazonReady(false);
        setAmazonConnectionMessage(response.error || 'No Amazon store connected');
        return false;
      }

      const amazonProvider = response.data.providers?.amazon;
      const isConnected = response.data.amazon_connected === true;
      const isStoreBound = amazonProvider?.store_bound !== false;
      const isTenantBound = amazonProvider?.tenant_bound !== false;
      const isSellerResolved = amazonProvider?.seller_resolved !== false;
      const isReady = isConnected && isStoreBound && isTenantBound && isSellerResolved;

      setAmazonReady(isReady);
      setAmazonConnectionMessage(
        isReady
          ? null
          : amazonProvider?.error_message || 'No Amazon store connected'
      );

      return isReady;
    } catch (connectionError: any) {
      const messageText = connectionError?.message || 'No Amazon store connected';
      setAmazonReady(false);
      setAmazonConnectionMessage(messageText);
      return false;
    }
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
      inventory: { title: 'Inventory' },
      orders: { title: 'Orders' },
      shipments: { title: 'Shipments' },
      returns: { title: 'Returns' },
      settlements: { title: 'Settlements' },
      fees: { title: 'Fees' },
      claims: { title: 'Claims' },
      detection: { title: 'Findings' },
      system: { title: 'Audit updates' },
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
          title: 'Audit paused',
          description: s.error || s.message || 'Audit failed.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        toastShownRef.current.cancelled = true;
        toast({
          title: 'Audit stopped',
          description: s.message || 'This audit has been stopped.',
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

    const hydrateReplayTimeline = async (targetSyncId: string) => {
      try {
        const recentEvents = await getRecentSseEvents(250, currentTenantSlug);
        if (cancelled) return;

        const replayLogs = recentEvents
          .filter((event: RecentSSEEvent) => {
            const eventSyncId = extractEventSyncId(event);
            const eventTenantSlug = extractEventTenantSlug(event);
            return eventSyncId === targetSyncId && eventTenantSlug === currentTenantSlug;
          })
          .map((event: RecentSSEEvent) => mapEventToLogEntry(event))
          .filter((entry): entry is Omit<LogEntry, 'id'> => entry !== null);

        mergeLogEntries(replayLogs);
      } catch (replayError) {
        console.warn('[Sync] Failed to reconstruct replay timeline:', replayError);
      }
    };

    const ensureSync = async (): Promise<string | null> => {
      if (!syncId) {
        try {
          resetLogTimeline();
          setLogsFinished(false);
          modalDismissedRef.current = false;
          logsFinishedRef.current = false;

          const amazonConnected = await checkAmazonConnection();
          if (cancelled) return null;

          if (!amazonConnected) {
            setStatus('idle');
            setMessage('No Amazon store connected');
            setError(null);
            return null;
          }

          const start = await startSync(currentTenantSlug);
          if (cancelled) return null;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Audit started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };

          toast({
            title: 'Audit started',
            description: 'We\'re pulling your latest Amazon SP-API records. This can take a few minutes.',
            duration: 4000,
          });

          navigate(`/sync?id=${newSyncId}`, { replace: true });
          return null;
        } catch (e: any) {
          if (cancelled) return null;
          const errorMsg = e?.message || 'Could not start audit';
          const isBlockedError = errorMsg.toLowerCase().includes('already in progress');

          setStatus('failed');
          setMessage(errorMsg);
          setError(errorMsg);
          setIsSyncBlocked(isBlockedError);
          previousStatusRef.current = 'failed';

          toast({
            title: isBlockedError ? 'Audit blocked' : 'Could not start audit',
            description: isBlockedError
              ? 'A previous audit appears stuck. Use "Clear and retry" to fix this.'
              : errorMsg,
            variant: 'destructive',
            duration: 5000,
          });

          return null;
        }
      }

      resetLogTimeline();

      try {
        const s = await getSyncStatus(syncId, currentTenantSlug);
        if (cancelled) return null;

        console.log('[Sync] Received sync status:', s);
        updateSyncState(s);
        await hydrateReplayTimeline(syncId);
        return syncId;
      } catch (e: any) {
        if (cancelled) return null;
        console.error('Failed to load sync status:', e);
        const errorMessage = e?.message || 'Could not load audit';

        if (errorMessage.includes('not found') || errorMessage.includes('Sync not found')) {
          setSyncId(undefined);
          setSyncData(null);
          setStatus('idle');
          setProgress(0);
          setMessage('Audit not found. Please start a new audit.');
          setError(null);
          navigate(tenantRoute(currentTenantSlug, '/sync'), { replace: true });

          toast({
            title: 'Audit not found',
            description: 'The audit you were viewing is no longer available. Start a new one to continue.',
            duration: 5000,
          });
        } else {
          setError(errorMessage);
          toast({
            title: 'Could not load audit',
            description: errorMessage || 'We could not load this audit. Please refresh the page.',
            variant: 'destructive',
            duration: 5000,
          });
        }

        return null;
      }
    };

    const setupSyncMonitoring = async () => {
      const activeSyncId = await ensureSync();
      if (cancelled || !activeSyncId) {
        return;
      }

      try {
        unsubscribe = subscribeSyncProgress(activeSyncId, (s: any) => {
          if (cancelled) return;
          const incomingSyncId = extractEventSyncId(s);

          if (!incomingSyncId) {
            warnIgnoredForeignEvent('missing_sync_id', activeSyncId, s);
            return;
          }

          if (incomingSyncId !== activeSyncId) {
            warnIgnoredForeignEvent('sync_id_mismatch', activeSyncId, s);
            return;
          }

          if (s.status === 'connected') {
            return;
          }

          if (s.type === 'log' && s.log) {
            console.log('[Sync] Log event received:', s.log);
            const logEntry = mapEventToLogEntry(s);
            if (logEntry) {
              mergeLogEntries([logEntry]);
            }
            return;
          }

          if (s.type === 'detection' && s.status === 'completed') {
            console.log('[Sync] Detection completed event received:', s);
            const detectedCount = s.claimsDetected ?? null;
            const estimatedValue = s.totalRecoverableValue ?? null;

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
          setSseStatus(connectionState);
        }, currentTenantSlug);
      } catch (err) {
        console.error('SSE connection failed, falling back to polling:', err);
      }

      let pollsAfterComplete = 0;
      const MAX_POLLS_AFTER_COMPLETE = 12;

      interval = setInterval(async () => {
        if (cancelled) return;
        if (sseStatusRef.current === 'connected') return;
        try {
          const s = await getSyncStatus(activeSyncId, currentTenantSlug);
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
            setMessage('Audit not found. Please start a new audit.');
            navigate('/sync', { replace: true });
          }
        }
      }, 3000);
    };

    void setupSyncMonitoring();

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
      setMessage('Audit stopped');
      previousStatusRef.current = 'cancelled';
      toastShownRef.current.cancelled = true;

      toast({
        title: 'Audit stopped',
        description: 'This audit has been stopped.',
        duration: 4000,
      });

      const s = await getSyncStatus(syncId, currentTenantSlug);
      updateSyncState(s);
    } catch (e: any) {
      setError(e?.message || 'Could not stop audit');
      toast({
        title: 'Could not stop audit',
        description: e?.message || 'We could not stop this audit. Please try again.',
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
    setMessage('Preparing your audit...');
    setError(null);
    setSyncData(null);
    resetLogTimeline();
    setLogsFinished(false);
    logsFinishedRef.current = false;
    previousStatusRef.current = 'idle';
    toastShownRef.current = {};

    toast({
      title: 'Starting a new audit',
      description: 'We\'re resetting this page and starting again.',
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
        title: 'Audit reset',
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
      const errorMsg = e?.message || 'Could not reset this audit';
      setError(errorMsg);

      toast({
        title: 'Could not reset audit',
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
  <title>Margin | Audit Log - ${exportDate}</title>
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
    <span><strong>Audit ID:</strong> ${syncId || 'N/A'}</span>
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

  const statusPresentation = {
    idle: {
      label: 'Ready',
      summary: amazonReady === false
        ? 'No Amazon store connected. Connect Amazon before you run an Amazon SP-API sync here.'
        : 'Start an Amazon SP-API sync to pull your latest Amazon records and watch the review unfold here.',
      badgeClass: 'border-white/10 text-white/60 bg-white/[0.02]',
    },
    running: {
      label: 'Audit in progress',
      summary: message || 'We are pulling your latest Amazon SP-API records now.',
      badgeClass: 'border-white/10 text-white/70 bg-white/[0.02]',
    },
    detecting: {
      label: 'Reviewing findings',
      summary: message || 'We are checking the Amazon SP-API records we pulled and looking for issues worth your attention.',
      badgeClass: 'border-amber-500/20 text-amber-200 bg-amber-500/[0.08]',
    },
    completed: {
      label: 'Audit complete',
      summary: message || 'This audit finished and the latest confirmed updates are shown below.',
      badgeClass: 'border-white/10 text-white/80 bg-white/[0.04]',
    },
    failed: {
      label: 'Needs attention',
      summary: error || message || 'We hit a problem while running this audit.',
      badgeClass: 'border-red-500/20 text-red-200 bg-red-500/[0.08]',
    },
    cancelled: {
      label: 'Audit stopped',
      summary: message || 'This audit was stopped before it finished.',
      badgeClass: 'border-white/10 text-white/60 bg-white/[0.02]',
    },
  } as const;

  const activeStatusPresentation = statusPresentation[status];
  const liveUpdateLabel = sseStatus === 'connected' ? 'Live updates on' : 'Checking for updates';
  const progressWidth = `${Math.max(0, Math.min(progress, 100))}%`;

  return (
    <PageLayout title="Audit" noPadding hideNavbar hideSidebar midnight hideLogo logoFontFamily='"Nunito Sans", sans-serif'>
      <div className="min-h-screen bg-[#070707] text-white relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="relative z-10 w-full mx-auto px-6 lg:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-[#111111] border border-white/10">
                  <Target className="h-5 w-5 text-white/80" />
                </div>
                <h1 className="text-2xl font-sans font-light tracking-tight">Audit Engine</h1>
                <Badge variant="outline" className="text-[10px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/60 bg-white/[0.02]">
                  Amazon SP-API Sync
                </Badge>
                <Badge variant="outline" className={`text-[10px] font-sans font-bold uppercase tracking-tight ${activeStatusPresentation.badgeClass}`}>
                  {activeStatusPresentation.label}
                </Badge>
              </div>
              <p className="text-sm text-white/40 max-w-2xl">
                Follow this Amazon SP-API sync as it pulls your Amazon records, checks what changed, and shows confirmed issues or recovery-related updates for this run only.
              </p>
              <p className="text-xs text-white/25 max-w-2xl mt-2 font-sans tracking-tight">
                CSV uploads are tracked on the Data Upload page, not here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(status === 'running' || status === 'detecting') && (
                <Badge variant="outline" className="text-[10px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/60 bg-white/[0.02]">
                  {liveUpdateLabel}
                </Badge>
              )}
              {logs.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/60 bg-white/[0.02]">
                  {filteredLogs.length} entries
                </Badge>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-white/[0.02] border border-white/10 p-5 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Current audit</p>
                <h2 className="text-xl font-sans font-light tracking-tight text-white">{activeStatusPresentation.label}</h2>
                <p className="text-sm text-white/40 max-w-2xl">{activeStatusPresentation.summary}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/55 bg-white/[0.02]">
                    Source: Amazon SP-API Sync
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/40 bg-white/[0.02]">
                    CSV uploads: Data Upload page
                  </Badge>
                </div>
              </div>

              <div className="min-w-[240px] rounded-xl bg-white/[0.02] border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Progress</span>
                  <span className="text-[11px] font-sans font-semibold tracking-tight text-white/60">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-white/80 transition-all duration-500" style={{ width: progressWidth }} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] text-white/25 font-sans font-bold uppercase tracking-tight">
              {syncData?.startedAt && (
                <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> Started: {formatDateTime(syncData.startedAt)}</span>
              )}
              {syncData?.completedAt && (
                <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-white/45" /> Completed: {formatDateTime(syncData.completedAt)}</span>
              )}
            </div>
          </motion.div>

          {!syncId && amazonReady === false && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-xl bg-white/[0.02] border border-white/10 p-5 mb-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white">No Amazon store connected</h3>
                  <p className="text-sm text-white/45 max-w-2xl">
                    {amazonConnectionMessage || 'Connect Amazon before you run an Amazon SP-API sync here.'}
                  </p>
                  <p className="text-xs text-white/25 font-sans tracking-tight">
                    CSV uploads are still available on the Data Upload page.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => navigate(tenantRoute(currentTenantSlug, '/integrations'))}
                    className="bg-[#141414] hover:bg-[#1b1b1b] border border-white/10 text-white font-medium px-6 h-10 shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                  >
                    Connect Amazon
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(tenantRoute(currentTenantSlug, '/data-upload'))}
                    className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
                  >
                    Open Data Upload
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-xl bg-gradient-to-r from-red-500/[0.08] to-orange-500/[0.04] border border-red-500/20 p-5 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-300 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-300 mb-1">This audit needs attention</h3>
                  <p className="text-sm text-red-100/70 leading-relaxed">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-white/[0.01] border border-white/10 p-5"
          >
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[16px] font-sans font-medium text-white tracking-tight">Audit activity</h4>
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-white/20 hover:text-white transition-colors cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[#0A0A0A] border-white/10 text-neutral-200 p-4 max-w-[320px] shadow-2xl ml-2 rounded-xl">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="font-sans font-bold text-white text-xs tracking-tight uppercase">What you see</p>
                              <p className="text-sm leading-relaxed text-white/40 font-sans">
                                This feed shows confirmed updates for this Amazon SP-API sync only. Entries are grouped by orders, inventory, shipments, returns, settlements, fees, claims, and findings.
                              </p>
                            </div>
                            <div className="pt-2 border-t border-white/5">
                              <p className="text-xs text-white/20 italic font-sans">
                                CSV uploads do not appear here. Track those on the Data Upload page.
                              </p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-[11px] text-white/20 font-sans tracking-tight font-bold uppercase">{filteredLogs.length} entries</span>
                </div>

                {/* Filter Toggles & Export */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-1">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`pb-3 text-[11px] font-sans font-bold uppercase tracking-tight transition-all relative ${logFilter === 'all'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      All updates
                      {logFilter === 'all' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-white/70" />}
                    </button>
                    <button
                      onClick={() => setLogFilter('money')}
                      className={`pb-3 text-[11px] font-sans font-bold uppercase tracking-tight transition-all relative ${logFilter === 'money'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      Recovery-related
                      {logFilter === 'money' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-white/70" />}
                    </button>
                    <button
                      onClick={() => setLogFilter('issues')}
                      className={`pb-3 text-[11px] font-sans font-bold uppercase tracking-tight transition-all relative ${logFilter === 'issues'
                        ? 'text-white'
                        : 'text-white/20 hover:text-white/40'
                        }`}>
                      Issues
                      {logFilter === 'issues' && <motion.div layoutId="sync-tab" className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-white/70" />}
                    </button>
                  </div>

                  {/* Export Button */}
                  {logs.length > 0 && (
                    <button
                      onClick={exportLogs}
                      className="pb-3 flex items-center gap-2 text-[11px] font-sans font-bold text-white/20 hover:text-white transition-all uppercase tracking-tight">
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
                  placeholder="Search this audit"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-11 h-12 text-[12px] font-sans bg-white/[0.02] border-white/5 focus:bg-white/[0.04] focus:border-white/10 rounded-xl placeholder:text-white/20 text-white shadow-none transition-all tracking-tight"
                />
              </div>

              {/* Log Container */}
              <div className="relative group">
                <div className="absolute top-0 left-0 right-0 h-10 bg-[#0A0A0A] rounded-t-xl border-b border-white/5 flex items-center px-5 z-10">
                  <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Current audit feed</span>
                </div>


                <div
                  ref={logContainerRef}
                  data-lenis-prevent
                  className="bg-[#050505] rounded-xl pt-14 pb-6 px-5 font-normal text-[13px] h-[500px] overflow-y-auto overscroll-contain scroll-smooth border border-white/5 shadow-2xl relative leading-relaxed tracking-tight text-white/40">
                  {/* Simplified subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none rounded-lg"></div>

                  {filteredLogs.length === 0 ? (
                    <div className="text-gray-400 flex flex-col items-center justify-center h-full relative z-10">
                      {logFilter === 'issues' ? (
                        <>
                          <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                          <span className="text-xs opacity-40 uppercase tracking-tight font-sans">No issues reported for this audit</span>
                          <span className="text-xs text-gray-500 mt-1 font-sans">Warnings and errors will appear here if this audit reports them.</span>
                        </>
                      ) : logFilter === 'money' ? (
                        <>
                          <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                          <span className="text-xs opacity-40 uppercase tracking-tight font-sans">No recovery-related updates yet</span>
                          <span className="text-xs text-gray-500 mt-1 font-sans">Recovery-related updates will appear here when this audit reports them.</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                          <span className="text-xs opacity-40 uppercase tracking-tight font-sans">No updates available yet</span>
                          <span className="text-xs text-gray-500 mt-1 font-sans">This area will fill in as confirmed audit events arrive.</span>
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
                                <span key={i} className="text-neutral-400 text-sm border border-neutral-800 px-1 rounded-sm tracking-tight">
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
                              className="w-full text-left flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
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
                              <span className="font-sans font-bold text-white text-[10px] uppercase tracking-tight">{story.title}</span>
                            </button>

                            {/* Expanded Log Details */}
                            {isExpanded && (
                              <div className="ml-5 pl-4 border-l border-neutral-900 mt-1 space-y-0.5">
                                {story.logs.map((log, index) => {
                                  const formattedTimestamp = formatLogTimestamp(log.timestamp);

                                  return (
                                    <React.Fragment key={log.id}>
                                      <div
                                        className={`flex items-start gap-4 py-2 px-3 text-[12px] font-sans border-b border-white/[0.02] last:border-0 ${log.type === 'thinking' ? 'opacity-20 italic' : ''}`}>
                                        {/* Timestamp - very subtle */}
                                        <span
                                          className="hidden sm:inline text-white/10 shrink-0 text-[10px] font-sans font-bold tracking-tight"
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
                                        <div className="ml-12 mt-1 mb-2 space-y-0.5 text-sm text-gray-300 font-sans tracking-tight">
                                          {log.context.details.map((detail, i) => (
                                            <div key={i} className={detail.startsWith('✅') ? 'text-white/70' : ''}>
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
          </motion.div>

          <div className="pt-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-white/[0.02] border border-white/10 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Audit controls</p>
                  <h3 className="text-lg font-sans font-light tracking-tight text-white">
                    {status === 'running'
                      ? 'Amazon SP-API sync in progress'
                      : !syncId && amazonReady === false
                        ? 'Amazon connection required'
                        : 'Ready for the next step'}
                  </h3>
                  <p className="text-sm text-white/40 max-w-2xl">
                    {status === 'running'
                      ? 'This Amazon SP-API sync is still running. You can let it continue or stop it if needed.'
                      : !syncId && amazonReady === false
                        ? 'Connect an Amazon store to run this page. CSV uploads continue to live on the Data Upload page.'
                        : 'Run another Amazon SP-API sync, clear a stuck run, or move to your dashboard once this review is complete.'}
                  </p>
                </div>

                {status === 'running' ? (
                  <div className="rounded-xl bg-white/[0.02] border border-white/10 px-4 py-3 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-white/60 animate-spin" />
                    <div>
                      <p className="text-xs font-sans font-bold uppercase tracking-tight text-white/50">Audit in progress</p>
                      <p className="text-[11px] text-white/35 font-sans">New updates will appear above as they arrive.</p>
                    </div>
                  </div>
                ) : !syncId && amazonReady === false ? (
                  <Button
                    onClick={() => navigate(tenantRoute(currentTenantSlug, '/integrations'))}
                    className="bg-[#141414] hover:bg-[#1b1b1b] border border-white/10 text-white font-medium px-6 h-10 shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                  >
                    Connect Amazon
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      try {
                        const amazonConnected = await checkAmazonConnection();
                        if (!amazonConnected) {
                          setStatus('idle');
                          setMessage('No Amazon store connected');
                          setError(null);
                          return;
                        }

                        resetLogTimeline();
                        setLogsFinished(false);
                        logsFinishedRef.current = false;
                        setStatus('idle');
                        setSyncId(undefined);
                        setError(null);

                        const start = await startSync(currentTenantSlug);
                        const newSyncId = start.syncId;
                        setSyncId(newSyncId);
                        setStatus('running');
                        setMessage(start.message || 'Audit started successfully');
                        previousStatusRef.current = 'running';
                        toastShownRef.current = { started: true };

                        toast({
                          title: 'Audit started',
                          description: 'We\'re pulling your latest Amazon SP-API records. This can take a few minutes.',
                          duration: 4000,
                        });

                        navigate(`/sync?id=${newSyncId}`, { replace: true });
                      } catch (e: any) {
                        setStatus('failed');
                        setMessage(e?.message || 'Could not start audit');
                        setError(e?.message || 'Could not start audit');
                        toast({
                          title: 'Audit paused',
                          description: e?.message || 'We could not start this audit. Please try again.',
                          variant: 'destructive',
                          duration: 5000,
                        });
                      }
                    }}
                    className="bg-[#141414] hover:bg-[#1b1b1b] border border-white/10 text-white font-medium px-6 h-10 shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run audit again
                  </Button>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {status === 'running' ? (
                  <Button
                    onClick={handleCancelSync}
                    disabled={isCancelling}
                    variant="outline"
                    className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Stop audit
                  </Button>
                ) : (status === 'failed' || status === 'cancelled') ? (
                  <>
                    {isSyncBlocked ? (
                      <Button
                        onClick={handleForceClear}
                        disabled={isClearing}
                        variant="outline"
                        className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
                      >
                        {isClearing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Clear and retry
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start a new audit
                      </Button>
                    )}
                  </>
                ) : null}

                <Button
                  onClick={() => status === 'completed' && navigate(`/app/${currentTenantSlug}/dashboard`)}
                  disabled={status !== 'completed'}
                  variant="outline"
                  className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6 disabled:opacity-30"
                >
                  Go to dashboard
                </Button>
              </div>
            </motion.div>
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
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-white/5 rounded-xl shadow-2xl bg-[#050505]">
              <DialogHeader className="px-6 py-8 bg-[#0A0A0A] border-b border-white/5">
                <DialogTitle className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">
                  Connect document sources
                </DialogTitle>
                <DialogDescription className="text-[12px] text-white/40 mt-2 font-sans leading-relaxed">
                  If you want deeper document matching after this audit, connect the inboxes or storage tools where your proof usually lives.
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-xl disabled:opacity-50">
                    {providerLoading === 'gmail' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={GmailIcon} alt="Gmail" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-white/40 group-hover:text-white uppercase tracking-tight">Gmail</span>
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-xl disabled:opacity-50">
                    {providerLoading === 'outlook' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={OutlookIcon} alt="Outlook" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-white/40 group-hover:text-white uppercase tracking-tight">Outlook</span>
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-xl disabled:opacity-50">
                    {providerLoading === 'gdrive' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={GoogleDriveIcon} alt="Google Drive" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-white/40 group-hover:text-white uppercase tracking-tight">Drive</span>
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
                    className="group flex flex-col items-center justify-center gap-4 p-8 border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 rounded-xl disabled:opacity-50">
                    {providerLoading === 'dropbox' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <img src={DropboxIcon} alt="Dropbox" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-opacity opacity-40 group-hover:opacity-100 duration-500" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-white/40 group-hover:text-white uppercase tracking-tight">Dropbox</span>
                  </button>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-[#0A0A0A] flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSourcesModal(false)}
                  className="text-[10px] text-white/20 hover:text-white hover:bg-transparent font-sans font-bold uppercase tracking-tight transition-colors">
                  Maybe later
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PageLayout >
  );
}
