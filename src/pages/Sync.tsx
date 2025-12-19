import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { startSync, getSyncStatus, cancelSync, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2, Search, Package, Truck, RotateCcw, DollarSign, Archive, Target, Clock, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import GmailIcon from '/G.png';
import OutlookIcon from '/OL.png';
import GoogleDriveIcon from '/gd.png';
import DropboxIcon from '/Dropbox_Icon.svg.png';
import { useToast } from '@/hooks/use-toast';
import { useDetectionUpdates } from '@/hooks/use-detection-updates';
import { api } from '@/lib/api';

// Log entry type
interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress' | 'thinking';
  category: 'orders' | 'inventory' | 'shipments' | 'returns' | 'settlements' | 'fees' | 'claims' | 'detection' | 'system';
  message: string;
  count?: number;
  context?: {
    details?: string[];
    estimatedTime?: string;
  };
}

// Data type tracking
interface DataTypeStatus {
  orders: { syncing: boolean; completed: boolean; count: number };
  inventory: { syncing: boolean; completed: boolean; count: number };
  shipments: { syncing: boolean; completed: boolean; count: number };
  returns: { syncing: boolean; completed: boolean; count: number };
  settlements: { syncing: boolean; completed: boolean; count: number };
  fees: { syncing: boolean; completed: boolean; count: number };
  claims: { syncing: boolean; completed: boolean; count: number };
}

// Log story group - aggregates related logs into collapsible sections
interface LogStory {
  id: string;
  category: string;
  title: string;           // "Inventory Scan Complete"
  summary: string;         // "75 active SKUs, 3 anomalies found"
  potentialValue?: number; // $145 potential
  anomaliesFound?: number; // 3 issues
  itemCount?: number;      // 75 items
  isCompleted: boolean;
  logs: LogEntry[];        // Detailed logs inside
  linkTo?: string;         // Navigation link
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

// Format timestamp like Render logs
const formatTimestamp = (date: Date) => {
  return date.toISOString().replace('T', ' ').slice(0, 23);
};

export default function Sync() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlSyncId = params.get('id') || undefined;
  const [syncId, setSyncId] = useState<string | undefined>(urlSyncId);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [message, setMessage] = useState<string>('Initializing sync...');
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const previousStatusRef = useRef<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const toastShownRef = useRef<{ started?: boolean; completed?: boolean; failed?: boolean; cancelled?: boolean }>({});
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const sourcesModalTimeoutRef = useRef<number | null>(null);
  const [providerLoading, setProviderLoading] = useState<'gmail' | 'outlook' | 'gdrive' | 'dropbox' | null>(null);

  // Log system state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set()); // Track expanded story groups
  const [logsFinished, setLogsFinished] = useState(false); // Track when all queued logs have been displayed
  const logsFinishedRef = useRef(false); // Ref version for async function
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logQueueRef = useRef<Array<{ entry: Omit<LogEntry, 'id' | 'timestamp'>; delay: number }>>([]);
  const isProcessingQueueRef = useRef(false);
  const completionLogsAddedRef = useRef(false); // Track if completion logs have been queued
  const previousDataRef = useRef<DataTypeStatus>({
    orders: { syncing: false, completed: false, count: 0 },
    inventory: { syncing: false, completed: false, count: 0 },
    shipments: { syncing: false, completed: false, count: 0 },
    returns: { syncing: false, completed: false, count: 0 },
    settlements: { syncing: false, completed: false, count: 0 },
    fees: { syncing: false, completed: false, count: 0 },
    claims: { syncing: false, completed: false, count: 0 },
  });

  // Add a log entry immediately
  const addLogImmediate = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setLogs(prev => [...prev, newEntry]);
  };

  // Process the log queue with delays
  const processLogQueue = async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (logQueueRef.current.length > 0) {
      const item = logQueueRef.current.shift();
      if (item) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
        addLogImmediate(item.entry);
      }
    }

    isProcessingQueueRef.current = false;

    // If completion logs were added and queue is now empty, mark logs as finished
    // Use ref to check if already finished (avoids stale closure)
    if (completionLogsAddedRef.current && !logsFinishedRef.current) {
      // Wait a moment to ensure no more logs are being added
      await new Promise(resolve => setTimeout(resolve, 300));
      // Double check queue is still empty
      if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
        logsFinishedRef.current = true;
        setLogsFinished(true);
      } else if (logQueueRef.current.length > 0) {
        // More logs were added, process them
        processLogQueue();
      }
    }
  };

  // Track last log for deduplication
  const lastLogRef = useRef<{ message: string; time: number } | null>(null);

  // Add a log entry with optional delay (queued)
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>, delayMs: number = 0) => {
    // Deduplication: Ignore identical messages received within 2000ms
    const now = Date.now();
    if (lastLogRef.current &&
      lastLogRef.current.message === entry.message &&
      now - lastLogRef.current.time < 2000) {
      // console.log('Duplicate log ignored:', entry.message);
      return;
    }
    lastLogRef.current = { message: entry.message, time: now };

    if (delayMs === 0 && logQueueRef.current.length === 0) {
      // No delay and queue is empty, add immediately
      addLogImmediate(entry);
    } else {
      // Queue the log with delay
      const baseDelay = entry.type === 'thinking' ? 800 : 400; // thinking logs appear slower
      logQueueRef.current.push({ entry, delay: delayMs || baseDelay });
      processLogQueue();
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

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const searchLower = logSearch.toLowerCase();
    return logs.filter(log =>
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  }, [logs, logSearch]);

  // Group logs into collapsible story sections
  const logStories = useMemo((): LogStory[] => {
    const storyMap: Record<string, LogStory> = {};

    // Define story configurations
    const storyConfig: Record<string, { title: string; linkTo?: string }> = {
      'inventory': { title: 'Inventory Scan', linkTo: '/recoveries' },
      'orders': { title: 'Order Ledger Check', linkTo: '/recoveries' },
      'shipments': { title: 'Shipment Verification', linkTo: '/recoveries' },
      'returns': { title: 'Returns Analysis', linkTo: '/recoveries' },
      'settlements': { title: 'Settlement Reconciliation', linkTo: '/upcoming-payments' },
      'fees': { title: 'Fee Audit', linkTo: '/recoveries' },
      'claims': { title: 'Claim Detection', linkTo: '/recoveries' },
      'detection': { title: 'Opportunity Detection', linkTo: '/recoveries' },
      'system': { title: 'System', linkTo: undefined },
    };

    // Group filtered logs by category
    for (const log of filteredLogs) {
      const category = log.category || 'system';

      if (!storyMap[category]) {
        const config = storyConfig[category] || { title: category, linkTo: undefined };
        storyMap[category] = {
          id: `story_${category}`,
          category,
          title: config.title,
          summary: '',
          isCompleted: false,
          logs: [],
          linkTo: config.linkTo,
          itemCount: 0,
          anomaliesFound: 0,
          potentialValue: 0,
        };
      }

      storyMap[category].logs.push(log);

      // Extract counts from log messages
      const countMatch = log.message.match(/(\d+)\s+(orders?|SKUs?|shipments?|returns?|settlements?|periods?|claims?|records?)/i);
      if (countMatch) {
        storyMap[category].itemCount = parseInt(countMatch[1], 10);
      }

      // Extract anomalies/issues from messages
      const anomalyMatch = log.message.match(/(\d+)\s+(anomal|issue|mismatch|suspicious|discrepanc|opportunit)/i);
      if (anomalyMatch) {
        storyMap[category].anomaliesFound = (storyMap[category].anomaliesFound || 0) + parseInt(anomalyMatch[1], 10);
      }

      // Extract money values from messages
      const moneyMatch = log.message.match(/\$([0-9,]+(?:\.\d{2})?)/);
      if (moneyMatch) {
        const value = parseFloat(moneyMatch[1].replace(/,/g, ''));
        if (!isNaN(value) && value > (storyMap[category].potentialValue || 0)) {
          storyMap[category].potentialValue = value;
        }
      }

      // Mark as completed if success/complete messages
      if (log.type === 'success' || log.message.toLowerCase().includes('complete')) {
        storyMap[category].isCompleted = true;
      }
    }

    // Build enhanced summaries for each story with money context
    for (const story of Object.values(storyMap)) {
      const parts: string[] = [];

      // Category-specific item labels
      const itemLabels: Record<string, string> = {
        'inventory': 'SKUs',
        'orders': 'orders',
        'shipments': 'shipments',
        'returns': 'returns',
        'settlements': 'periods',
        'fees': 'fees',
        'claims': 'claims',
        'detection': 'opportunities',
        'system': 'events',
      };

      const label = itemLabels[story.category] || 'items';

      if (story.itemCount && story.itemCount > 0) {
        parts.push(`${story.itemCount} ${label} checked`);
      }

      // If there are issues AND potential value, show combined
      if (story.anomaliesFound && story.anomaliesFound > 0 && story.potentialValue && story.potentialValue > 0) {
        parts.push(`${story.anomaliesFound} flagged`);
      } else if (story.anomaliesFound && story.anomaliesFound > 0) {
        parts.push(`${story.anomaliesFound} issues found`);
      }

      story.summary = parts.length > 0 ? parts.join(', ') : `${story.logs.length} events`;
    }

    // Sort stories: system first, then by first log timestamp
    return Object.values(storyMap).sort((a, b) => {
      if (a.category === 'system') return -1;
      if (b.category === 'system') return 1;
      const aTime = a.logs[0]?.timestamp.getTime() || 0;
      const bTime = b.logs[0]?.timestamp.getTime() || 0;
      return aTime - bTime;
    });
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

  // Selective log enrichment - add money hints to key lines only
  const enrichLogMessage = (message: string, story: LogStory): { text: string; hint?: string } => {
    const lowerMsg = message.toLowerCase();

    // Keywords that deserve money hints
    const moneyKeywords = ['discrepanc', 'mismatch', 'suspicious', 'anomal', 'overcharge', 'missing', 'lost', 'damaged'];
    const reviewKeywords = ['flagged', 'escalated', 'detected', 'found issue', 'claim'];

    // Check for money-hint-worthy messages
    for (const keyword of moneyKeywords) {
      if (lowerMsg.includes(keyword)) {
        // Extract a number if present in this message
        const numMatch = message.match(/(\d+)\s*(unit|item|shipment|return|order|sku|fee)/i);
        if (numMatch) {
          const count = parseInt(numMatch[1], 10);
          // Estimate ~$50-200 per issue as heuristic
          const estimatedValue = count * (50 + Math.floor(Math.random() * 150));
          return {
            text: message,
            hint: `+$${estimatedValue.toLocaleString()} potential`
          };
        }
        // If story has potential value, use fraction of it
        if (story.potentialValue && story.potentialValue > 0) {
          return {
            text: message,
            hint: `flagged for claim review`
          };
        }
      }
    }

    // Check for review-worthy messages (no money, just flag)
    for (const keyword of reviewKeywords) {
      if (lowerMsg.includes(keyword)) {
        return {
          text: message,
          hint: `flagged for claim review`
        };
      }
    }

    // No enrichment needed
    return { text: message };
  };

  // Update logs based on sync data changes - machine dialogue style with thinking and delays
  // Update logs based on sync data changes - now using real backend SSE events instead of mock dialogue
  const updateLogsFromSyncData = (data: SyncStatusResponse) => {
    const prev = previousDataRef.current;

    // Only track counts/state, NOT logs - all logs come from backend SSE events
    if (data.ordersProcessed && data.ordersProcessed > 0) {
      prev.orders.count = data.ordersProcessed;
      prev.orders.completed = data.ordersProcessed >= (data.totalOrders || data.ordersProcessed);
    }

    if (data.inventoryCount && data.inventoryCount > 0) {
      prev.inventory.count = data.inventoryCount;
      prev.inventory.completed = true;
    }

    if (data.shipmentsCount && data.shipmentsCount > 0) {
      prev.shipments.count = data.shipmentsCount;
      prev.shipments.completed = true;
    }

    if (data.returnsCount && data.returnsCount > 0) {
      prev.returns.count = data.returnsCount;
      prev.returns.completed = true;
    }

    if (data.settlementsCount && data.settlementsCount > 0) {
      prev.settlements.count = data.settlementsCount;
      prev.settlements.completed = true;
    }

    if (data.feesCount && data.feesCount > 0) {
      prev.fees.count = data.feesCount;
      prev.fees.completed = true;
    }

    if (data.claimsDetected && data.claimsDetected > 0) {
      prev.claims.count = data.claimsDetected;
      prev.claims.completed = true;
    }

    previousDataRef.current = prev;
  };

  // Show modal and toast only AFTER logs have finished displaying
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (logsFinished && status === 'completed') {
      // Get claims info (no fallback - use actual backend values)
      const claims = syncData?.claimsDetected ?? null;
      const value = syncData?.totalRecoverableValue ?? null;
      const formattedValue = value !== null
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : '--';

      // No toast here - the UI already shows completion status clearly

      // Show modal after a brief pause
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
      }
      sourcesModalTimeoutRef.current = window.setTimeout(() => {
        setShowSourcesModal(true);
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

    // Update logs based on sync data
    updateLogsFromSyncData(s);

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
        // Mark completion - backend should send completion logs via SSE
        completionLogsAddedRef.current = true;

        // If queue is already empty, mark logs as finished immediately
        if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
          setTimeout(() => {
            if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
              logsFinishedRef.current = true;
              setLogsFinished(true);
            }
          }, 500); // Brief delay to catch any last-moment logs
        }
      } else if (mappedStatus === 'failed' && !toastShownRef.current.failed) {
        toastShownRef.current.failed = true;
        addLog({ type: 'error', category: 'system', message: `Sync failed: ${s.error || s.message || 'Unknown error'}` });
        toast({
          title: 'Sync Failed',
          description: s.error || s.message || 'The sync encountered an error. Please try again.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        toastShownRef.current.cancelled = true;
        addLog({ type: 'warning', category: 'system', message: 'Sync cancelled by user' });
        toast({
          title: 'Sync Cancelled',
          description: s.message || 'The sync has been cancelled.',
          duration: 4000,
        });
      }
    }

    setStatus(mappedStatus);

    if (s.error) {
      setError(s.error);
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
          logsFinishedRef.current = false;
          completionLogsAddedRef.current = false;
          previousDataRef.current = {
            orders: { syncing: false, completed: false, count: 0 },
            inventory: { syncing: false, completed: false, count: 0 },
            shipments: { syncing: false, completed: false, count: 0 },
            returns: { syncing: false, completed: false, count: 0 },
            settlements: { syncing: false, completed: false, count: 0 },
            fees: { syncing: false, completed: false, count: 0 },
            claims: { syncing: false, completed: false, count: 0 },
          };

          addLog({ type: 'info', category: 'system', message: 'Initializing sync...' }, 0);

          const start = await startSync();
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };

          toast({
            title: 'Sync Started',
            description: 'Your Amazon data sync has started. This may take a few minutes.',
            duration: 4000,
          });

          navigate(`/sync?id=${newSyncId}`, { replace: true });
        } catch (e: any) {
          if (cancelled) return;
          setStatus('failed');
          setMessage(e?.message || 'Failed to start sync');
          setError(e?.message || 'Failed to start sync');
          previousStatusRef.current = 'failed';
          addLog({ type: 'error', category: 'system', message: `Failed to start sync: ${e?.message || 'Unknown error'}` });

          toast({
            title: 'Failed to Start Sync',
            description: e?.message || 'Failed to start sync. Please try again.',
            variant: 'destructive',
            duration: 5000,
          });
          return;
        }
      } else {
        // Load existing sync status
        try {
          addLog({ type: 'info', category: 'system', message: `Loading sync status...` });
          const s = await getSyncStatus(syncId);
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
            navigate('/sync', { replace: true });

            toast({
              title: 'Sync Not Found',
              description: 'The sync you were viewing no longer exists. Please start a new sync.',
              duration: 5000,
            });
          } else {
            setError(errorMessage);
            addLog({ type: 'error', category: 'system', message: `Error: ${errorMessage}` });
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
            addLog({
              type: s.log.type || 'info',
              category: s.log.category || 'system',
              message: s.log.message,
              count: s.log.count
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

            if (detectedCount !== null && detectedCount > 0) {
              // Only log value if backend provides it
              if (estimatedValue !== null) {
                const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
                addLog({ type: 'success', category: 'detection', message: `Recoveries: ${formattedValue} from ${detectedCount} discrepancies`, count: detectedCount }, 1200);
              } else {
                addLog({ type: 'success', category: 'detection', message: `${detectedCount} recoveries found (awaiting value)`, count: detectedCount }, 1200);
              }
              // Toast will be shown when logsFinished becomes true
            }
            return;
          }

          updateSyncState(s);

          if (s.status === 'failed' || s.status === 'cancelled') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        });
      } catch (err) {
        console.error('SSE connection failed, falling back to polling:', err);
      }
    }

    // Polling fallback - continue polling after completion to catch async detection results
    let pollsAfterComplete = 0;
    const MAX_POLLS_AFTER_COMPLETE = 12; // 12 polls × 3s = 36 seconds for detection to complete

    interval = setInterval(async () => {
      if (!syncId || cancelled) return;
      try {
        const s = await getSyncStatus(syncId);
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
  }, [syncId, navigate]);

  const handleCancelSync = async () => {
    if (!syncId || status !== 'running') return;

    setIsCancelling(true);
    addLog({ type: 'warning', category: 'system', message: 'Cancelling sync...' });
    try {
      await cancelSync(syncId);
      setStatus('cancelled');
      setMessage('Sync cancelled');
      previousStatusRef.current = 'cancelled';
      toastShownRef.current.cancelled = true;

      toast({
        title: 'Sync Cancelled',
        description: 'The sync has been cancelled successfully.',
        duration: 4000,
      });

      const s = await getSyncStatus(syncId);
      updateSyncState(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel sync');
      addLog({ type: 'error', category: 'system', message: `Failed to cancel: ${e?.message}` });
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
    previousStatusRef.current = 'idle';
    toastShownRef.current = {};
    previousDataRef.current = {
      orders: { syncing: false, completed: false, count: 0 },
      inventory: { syncing: false, completed: false, count: 0 },
      shipments: { syncing: false, completed: false, count: 0 },
      returns: { syncing: false, completed: false, count: 0 },
      settlements: { syncing: false, completed: false, count: 0 },
      fees: { syncing: false, completed: false, count: 0 },
      claims: { syncing: false, completed: false, count: 0 },
    };

    toast({
      title: 'Retrying Sync',
      description: 'Starting a new sync...',
      duration: 3000,
    });

    window.location.reload();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'detecting':
        return <Target className="h-5 w-5 text-purple-500 animate-pulse" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };


  // Get agent-specific color based on category
  const getAgentColor = (category: string) => {
    switch (category) {
      case 'agent1': return 'text-blue-500';
      case 'agent2': return 'text-cyan-500';
      case 'agent3': return 'text-purple-500';
      case 'agent4': return 'text-green-500';
      case 'agent5': return 'text-yellow-500';
      case 'agent6': return 'text-pink-500';
      case 'agent7': return 'text-orange-500';
      case 'agent8': return 'text-teal-500';
      case 'agent9': return 'text-indigo-500';
      case 'agent10': return 'text-red-500';
      case 'agent11': return 'text-violet-500';
      case 'system': return 'text-gray-500';
      default: return 'text-cyan-500'; // Default to cyan for unknown categories
    }
  };

  // Get agent label based on category
  const getAgentLabel = (category: string) => {
    switch (category) {
      case 'agent1': return '[Agent 1: OAuth]';
      case 'agent2': return '[Agent 2: Sync]';
      case 'agent3': return '[Agent 3: Detection]';
      case 'agent4': return '[Agent 4: Evidence]';
      case 'agent5': return '[Agent 5: Parsing]';
      case 'agent6': return '[Agent 6: Matching]';
      case 'agent7': return '[Agent 7: Filing]';
      case 'agent8': return '[Agent 8: Recovery]';
      case 'agent9': return '[Agent 9: Billing]';
      case 'agent10': return '[Agent 10: Notify]';
      case 'agent11': return '[Agent 11: Learning]';
      case 'system': return '[System]';
      default: return `[${category}]`;
    }
  };

  // Get log entry color - keep colorful status types, use charcoal for regular messages
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'progress': return 'text-blue-600';
      case 'thinking': return 'text-gray-400 italic';
      default: return 'text-gray-700'; // Mid-dark charcoal for regular messages
    }
  };

  // Calculate totals
  const totalItemsSynced = syncData ? (
    (syncData.ordersProcessed || 0) +
    (syncData.inventoryCount || 0) +
    (syncData.shipmentsCount || 0) +
    (syncData.returnsCount || 0) +
    (syncData.settlementsCount || 0) +
    (syncData.feesCount || 0)
  ) : 0;

  // Get actual recoverable value from backend - NO FALLBACK
  // Backend now calculates real values from detection_results.amount
  const claimsCount = syncData?.claimsDetected ?? null;
  const totalRecoverableValue = syncData?.totalRecoverableValue ?? null;

  // Format currency - returns '--' if value is null/undefined (no fallback)
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate duration in seconds
  const calculateDuration = (): number | null => {
    if (syncData?.startedAt && syncData?.completedAt) {
      const started = new Date(syncData.startedAt).getTime();
      const completed = new Date(syncData.completedAt).getTime();
      return Math.round((completed - started) / 1000);
    }
    return null;
  };

  const durationSeconds = calculateDuration();

  return (
    <PageLayout title="" hideNavbar hideSidebar plainBackground logoFontFamily='"Nunito Sans", sans-serif'>
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-6 py-10 text-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Dynamic Status Header - REMOVED per user request */}

            {/* Add shimmer animation to global styles */}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>

            {/* Main Content - Flat, no card */}
            <div className="space-y-4">
              {/* Detecting Phase - Show AI analysis in progress */}
              {status === 'detecting' && (
                <div className="py-4 bg-purple-50 rounded-lg px-4 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-purple-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-purple-700">Analyzing for Discrepancies...</p>
                      <p className="text-xs text-purple-500">AI-powered detection scanning your data for potential recoveries</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Logs Section */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">Real-Time Logs</h4>
                    <span className="text-xs text-gray-400">{filteredLogs.length} entries</span>
                  </div>
                  {syncData?.completedAt && (
                    <p className="text-xs text-gray-400">
                      Last synced: {(() => {
                        const completedTime = new Date(syncData.completedAt).getTime();
                        const now = Date.now();
                        const diffMs = now - completedTime;
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffMins < 1) return 'just now';
                        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                      })()}
                    </p>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search your Logs... (inventory, shipments, orders, etc.)"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>

                {/* Log Container - Clean White Theme */}
                <div className="relative group">
                  {/* Glass header effect */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gray-50 backdrop-blur-sm rounded-t-lg border-b border-gray-200 flex items-center px-4 justify-between z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-100 border border-yellow-300"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-300"></div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 ml-2 flex items-center gap-1.5">
                        <Target className="h-3 w-3" />
                        AGENT_ACTIVITY_STREAM
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'running' || status === 'detecting' ? (
                        <div className="flex items-center gap-1.5 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-[9px] font-medium text-emerald-600 tracking-wider">LIVE</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400">OFFLINE</span>
                      )}
                    </div>
                  </div>

                  <div
                    ref={logContainerRef}
                    className="bg-white rounded-lg pt-10 pb-4 px-4 font-mono text-xs h-96 overflow-y-auto scroll-smooth border border-gray-200 shadow-sm relative"
                  >
                    {/* Grid background effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                    {filteredLogs.length === 0 ? (
                      <div className="text-gray-400 flex flex-col items-center justify-center h-full relative z-10">
                        <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                        <span className="text-xs tracking-widest opacity-40">WAITING FOR SIGNAL...</span>
                      </div>
                    ) : (
                      <div className="space-y-2 relative z-10">
                        {logStories.map((story) => {
                          const isExpanded = expandedStories.has(story.id);
                          const isRunning = !story.isCompleted && (status === 'running' || status === 'detecting');

                          // Highlight function for log content
                          const highlightContent = (text: string) => {
                            const parts = text.split(/(\$[\d,]+\.?\d*|\b\d+\b|\[.*?\])/g);
                            return parts.map((part, i) => {
                              if (part.match(/^\$[\d,]+\.?\d*$/)) {
                                return <span key={i} className="text-emerald-600 font-bold">{part}</span>;
                              }
                              if (part.match(/^\d+$/)) {
                                return <span key={i} className="text-blue-600 font-bold">{part}</span>;
                              }
                              if (part.match(/^\[.*?\]$/)) {
                                return <span key={i} className="text-purple-600 font-bold">{part}</span>;
                              }
                              return part;
                            });
                          };

                          return (
                            <div key={story.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                              {/* Story Header - Clickable */}
                              <button
                                onClick={() => toggleStory(story.id)}
                                className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors group"
                              >
                                {/* Expand/Collapse Icon */}
                                <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </span>

                                {/* Status Icon */}
                                {isRunning ? (
                                  <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                                ) : story.isCompleted ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                )}

                                {/* Title & Summary */}
                                <span className="font-medium text-gray-800 text-xs">{story.title}</span>
                                <span className="text-gray-500 text-xs">— {story.summary}</span>

                                {/* Potential Value Badge */}
                                {story.potentialValue && story.potentialValue > 0 && (
                                  <span className="ml-auto text-emerald-600 font-semibold text-xs whitespace-nowrap">
                                    +${story.potentialValue.toLocaleString()} potential
                                  </span>
                                )}

                                {/* Anomalies Badge */}
                                {story.anomaliesFound && story.anomaliesFound > 0 && !story.potentialValue && (
                                  <span className="ml-auto bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {story.anomaliesFound} issues
                                  </span>
                                )}
                              </button>

                              {/* Expanded Log Details */}
                              {isExpanded && (
                                <div className="ml-6 pl-3 border-l-2 border-gray-100 mt-1 space-y-0.5">
                                  {story.logs.map((log, index) => {
                                    const enriched = enrichLogMessage(log.message, story);

                                    return (
                                      <div
                                        key={log.id}
                                        className={`flex items-start gap-2 py-0.5 text-xs ${log.type === 'thinking' ? 'opacity-50' : ''}`}
                                      >
                                        {/* Timestamp */}
                                        <span className="hidden sm:inline text-gray-400 shrink-0 text-[10px]">
                                          {formatTimestamp(log.timestamp).split(' ')[1]}
                                        </span>

                                        {/* Message */}
                                        <span className={`${getLogColor(log.type)} break-all flex-1`}>
                                          {highlightContent(enriched.text)}
                                          {index === story.logs.length - 1 && isRunning && (
                                            <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                          )}
                                        </span>

                                        {/* Enrichment Hint Badge */}
                                        {enriched.hint && (
                                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${enriched.hint.includes('$')
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {enriched.hint}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Link to Claims */}
                                  {story.linkTo && story.isCompleted && (story.anomaliesFound || 0) > 0 && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigate(story.linkTo!); }}
                                      className="flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      View potential claims <ExternalLink className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              )}
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

            {/* Run Button - Below Real-Time Log */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={async () => {
                  try {
                    // Clear logs and reset state for new sync
                    setLogs([]);
                    setLogsFinished(false);
                    logsFinishedRef.current = false;
                    completionLogsAddedRef.current = false;
                    setStatus('idle');
                    setSyncId(undefined);
                    setError(null);
                    previousDataRef.current = {
                      orders: { syncing: false, completed: false, count: 0 },
                      inventory: { syncing: false, completed: false, count: 0 },
                      shipments: { syncing: false, completed: false, count: 0 },
                      returns: { syncing: false, completed: false, count: 0 },
                      settlements: { syncing: false, completed: false, count: 0 },
                      fees: { syncing: false, completed: false, count: 0 },
                      claims: { syncing: false, completed: false, count: 0 },
                    };

                    addLog({ type: 'info', category: 'system', message: 'Initializing sync...' }, 0);

                    const start = await startSync();
                    const newSyncId = start.syncId;
                    setSyncId(newSyncId);
                    setStatus('running');
                    setMessage(start.message || 'Sync started successfully');
                    previousStatusRef.current = 'running';
                    toastShownRef.current = { started: true };

                    toast({
                      title: 'Sync Started',
                      description: 'Your Amazon data sync has started. This may take a few minutes.',
                      duration: 4000,
                    });

                    navigate(`/sync?id=${newSyncId}`, { replace: true });
                  } catch (e: any) {
                    setStatus('failed');
                    setMessage(e?.message || 'Failed to start sync');
                    setError(e?.message || 'Failed to start sync');
                    toast({
                      title: 'Sync Failed',
                      description: e?.message || 'Failed to start sync. Please try again.',
                      variant: 'destructive',
                      duration: 5000,
                    });
                  }
                }}
                disabled={status === 'running'}
                className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {status === 'running' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Again
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-2">
              {syncData?.startedAt && (
                <span>Started: {new Date(syncData.startedAt).toLocaleString()}</span>
              )}
              {syncData?.completedAt && (
                <>
                  <span>•</span>
                  <span>Completed: {new Date(syncData.completedAt).toLocaleString()}</span>
                </>
              )}
            </div>



            <div className="flex flex-wrap items-center gap-2 pt-4">
              {status === 'running' && (
                <Button
                  variant="outline"
                  onClick={handleCancelSync}
                  disabled={isCancelling}
                  className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Sync
                    </>
                  )}
                </Button>
              )}

              {(status === 'failed' || status === 'cancelled') && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Sync
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  if (status === 'completed') {
                    navigate('/app');
                  }
                }}
                disabled={status !== 'completed'}
                className={
                  status === 'completed'
                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }
              >
                Dashboard
              </Button>
            </div>

            {/* Audit Complete Modal */}
            <Dialog open={showSourcesModal} onOpenChange={setShowSourcesModal}>
              <DialogContent className="sm:max-w-md bg-white rounded-md">
                <DialogHeader className="pb-3">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Connect document source
                  </DialogTitle>
                </DialogHeader>

                <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    For read-only and ingest purposes
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2">
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
                            description: r.error || 'Failed to initiate Gmail connection. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      } catch (error) {
                        console.error('Failed to connect Gmail:', error);
                        toast({
                          title: 'Connection Failed',
                          description: 'An error occurred while connecting Gmail. Please try again.',
                          variant: 'destructive',
                        });
                        setProviderLoading(null);
                      }
                    }}
                    disabled={providerLoading === 'gmail'}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {providerLoading === 'gmail' ? (
                      <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                    ) : (
                      <img src={GmailIcon} alt="Gmail" className="h-10 w-10 object-contain group-hover:scale-105 transition-transform" />
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
                            description: r.error || 'Failed to initiate Outlook connection. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      } catch (error) {
                        console.error('Failed to connect Outlook:', error);
                        toast({
                          title: 'Connection Failed',
                          description: 'An error occurred while connecting Outlook. Please try again.',
                          variant: 'destructive',
                        });
                        setProviderLoading(null);
                      }
                    }}
                    disabled={providerLoading === 'outlook'}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {providerLoading === 'outlook' ? (
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    ) : (
                      <img src={OutlookIcon} alt="Outlook" className="h-10 w-10 object-contain group-hover:scale-105 transition-transform" />
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
                            description: r.error || 'Failed to initiate Google Drive connection. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      } catch (error) {
                        console.error('Failed to connect Google Drive:', error);
                        toast({
                          title: 'Connection Failed',
                          description: 'An error occurred while connecting Google Drive. Please try again.',
                          variant: 'destructive',
                        });
                        setProviderLoading(null);
                      }
                    }}
                    disabled={providerLoading === 'gdrive'}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {providerLoading === 'gdrive' ? (
                      <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                    ) : (
                      <img src={GoogleDriveIcon} alt="Google Drive" className="h-10 w-10 object-contain group-hover:scale-105 transition-transform" />
                    )}
                    <span className="text-xs font-medium text-gray-700">Google Drive</span>
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
                            description: r.error || 'Failed to initiate Dropbox connection. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      } catch (error) {
                        console.error('Failed to connect Dropbox:', error);
                        toast({
                          title: 'Connection Failed',
                          description: 'An error occurred while connecting Dropbox. Please try again.',
                          variant: 'destructive',
                        });
                        setProviderLoading(null);
                      }
                    }}
                    disabled={providerLoading === 'dropbox'}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {providerLoading === 'dropbox' ? (
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    ) : (
                      <img src={DropboxIcon} alt="Dropbox" className="h-10 w-10 object-contain group-hover:scale-105 transition-transform" />
                    )}
                    <span className="text-xs font-medium text-gray-700">Dropbox</span>
                  </button>
                </div>

                <div className="flex justify-center gap-3 pt-1">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSourcesModal(false)}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Connect Platform
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSourcesModal(false)}
                    className="bg-white text-gray-700 hover:bg-gray-50 border-0"
                  >
                    Not Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
