import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { startSync, getSyncStatus, cancelSync, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2, Search, Package, Truck, RotateCcw, DollarSign, Archive, Target, Clock } from 'lucide-react';
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
  thinkingDuration?: number; // seconds for "Thought for Xs" display
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

  // Add a log entry with optional delay (queued)
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>, delayMs: number = 0) => {
    if (delayMs === 0 && logQueueRef.current.length === 0) {
      // No delay and queue is empty, add immediately
      addLogImmediate(entry);
    } else {
      // Queue the log with delay
      const baseDelay = entry.type === 'thinking' ? 800 : 400; // thinking logs appear slower
      const thinkingDelay = entry.thinkingDuration ? entry.thinkingDuration * 300 : 0;
      logQueueRef.current.push({ entry, delay: delayMs || baseDelay + thinkingDelay });
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

  // Update logs based on sync data changes - machine dialogue style with thinking and delays
  const updateLogsFromSyncData = (data: SyncStatusResponse) => {
    const prev = previousDataRef.current;
    
    // Check orders - machine dialogue with thinking
    if (data.ordersProcessed && data.ordersProcessed > 0 && !prev.orders.completed) {
      if (!prev.orders.syncing) {
        addLog({ type: 'progress', category: 'orders', message: 'Accessing Order Ledger... scanning transactions', thinkingDuration: 2 }, 500);
        prev.orders.syncing = true;
      }
      if (data.ordersProcessed >= (data.totalOrders || data.ordersProcessed)) {
        addLog({ type: 'success', category: 'orders', message: `[FOUND] ${data.ordersProcessed.toLocaleString()} orders in ledger`, count: data.ordersProcessed }, 1200);
        addLog({ type: 'thinking', category: 'orders', message: `I see... ${data.ordersProcessed.toLocaleString()} transactions to cross-reference` }, 900);
        addLog({ type: 'info', category: 'orders', message: 'Now let me match these against fulfillment records...', thinkingDuration: 3 }, 1100);
        prev.orders.completed = true;
        prev.orders.count = data.ordersProcessed;
      }
    }
    
    // Check inventory - machine dialogue with thinking
    if (data.inventoryCount && data.inventoryCount > 0 && !prev.inventory.completed) {
      if (!prev.inventory.syncing) {
        addLog({ type: 'progress', category: 'inventory', message: 'Querying FBA Inventory Snapshot...', thinkingDuration: 2 }, 600);
        prev.inventory.syncing = true;
      }
      addLog({ type: 'success', category: 'inventory', message: `[FOUND] ${data.inventoryCount.toLocaleString()} active SKUs in warehouse`, count: data.inventoryCount }, 1400);
      addLog({ type: 'thinking', category: 'inventory', message: 'Hmm... checking if unit counts align with what was shipped' }, 800);
      addLog({ type: 'info', category: 'inventory', message: 'Cross-checking against inbound shipment manifests...', thinkingDuration: 4 }, 1300);
      prev.inventory.completed = true;
      prev.inventory.count = data.inventoryCount;
    }
    
    // Check shipments - machine dialogue with thinking
    if (data.shipmentsCount && data.shipmentsCount > 0 && !prev.shipments.completed) {
      if (!prev.shipments.syncing) {
        addLog({ type: 'progress', category: 'shipments', message: 'Mapping FBA Inbound Shipment history...', thinkingDuration: 3 }, 700);
        prev.shipments.syncing = true;
      }
      addLog({ type: 'success', category: 'shipments', message: `[FOUND] ${data.shipmentsCount.toLocaleString()} shipments to fulfillment centers`, count: data.shipmentsCount }, 1500);
      addLog({ type: 'thinking', category: 'shipments', message: `Looking at ${data.shipmentsCount} shipments... some quantities might not match` }, 1000);
      addLog({ type: 'info', category: 'shipments', message: 'Let me verify received quantities vs shipped quantities...', thinkingDuration: 5 }, 1400);
      prev.shipments.completed = true;
      prev.shipments.count = data.shipmentsCount;
    }
    
    // Check returns - machine dialogue with thinking
    if (data.returnsCount && data.returnsCount > 0 && !prev.returns.completed) {
      if (!prev.returns.syncing) {
        addLog({ type: 'progress', category: 'returns', message: 'Pulling Customer Return records...', thinkingDuration: 2 }, 600);
        prev.returns.syncing = true;
      }
      addLog({ type: 'success', category: 'returns', message: `[FOUND] ${data.returnsCount.toLocaleString()} customer returns processed`, count: data.returnsCount }, 1300);
      addLog({ type: 'thinking', category: 'returns', message: 'I see returns that may not have been credited back...' }, 900);
      addLog({ type: 'info', category: 'returns', message: 'Checking if each return was properly reimbursed...', thinkingDuration: 4 }, 1200);
      prev.returns.completed = true;
      prev.returns.count = data.returnsCount;
    }
    
    // Check settlements - machine dialogue with thinking
    if (data.settlementsCount && data.settlementsCount > 0 && !prev.settlements.completed) {
      if (!prev.settlements.syncing) {
        addLog({ type: 'progress', category: 'settlements', message: 'Downloading Settlement Reports...', thinkingDuration: 3 }, 800);
        prev.settlements.syncing = true;
      }
      addLog({ type: 'success', category: 'settlements', message: `[FOUND] ${data.settlementsCount.toLocaleString()} settlement periods`, count: data.settlementsCount }, 1600);
      addLog({ type: 'thinking', category: 'settlements', message: 'Now let me reconcile these payouts against expected amounts' }, 1000);
      addLog({ type: 'info', category: 'settlements', message: 'Calculating expected vs actual disbursements...', thinkingDuration: 6 }, 1500);
      prev.settlements.completed = true;
      prev.settlements.count = data.settlementsCount;
    }
    
    // Check fees - machine dialogue with thinking
    if (data.feesCount && data.feesCount > 0 && !prev.fees.completed) {
      if (!prev.fees.syncing) {
        addLog({ type: 'progress', category: 'fees', message: 'Extracting FBA Fee breakdown...', thinkingDuration: 2 }, 600);
        prev.fees.syncing = true;
      }
      addLog({ type: 'success', category: 'fees', message: `[FOUND] ${data.feesCount.toLocaleString()} fee line items`, count: data.feesCount }, 1400);
      addLog({ type: 'thinking', category: 'fees', message: 'Interesting... some fee calculations look off' }, 900);
      addLog({ type: 'info', category: 'fees', message: 'Analyzing each fee for potential overcharges...', thinkingDuration: 5 }, 1300);
      prev.fees.completed = true;
      prev.fees.count = data.feesCount;
    }
    
    // Check claims detected - machine dialogue with urgency and thinking
    if (data.claimsDetected && data.claimsDetected > 0 && !prev.claims.completed) {
      const estimatedValue = data.claimsDetected * 48;
      const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
      addLog({ type: 'thinking', category: 'detection', message: 'Finalizing analysis... compiling discrepancies found' }, 1000);
      addLog({ type: 'warning', category: 'detection', message: '[ALERT] Discrepancies detected in seller data' }, 1200);
      addLog({ type: 'thinking', category: 'detection', message: `I found ${data.claimsDetected} items that Amazon owes you for` }, 1100);
      addLog({ type: 'success', category: 'detection', message: `[RESULT] ${data.claimsDetected.toLocaleString()} recoverable items identified` }, 1300);
      addLog({ type: 'success', category: 'detection', message: `[ESTIMATED] Potential recovery: ${formattedValue}` }, 800);
      prev.claims.completed = true;
      prev.claims.count = data.claimsDetected;
    }
    
    previousDataRef.current = prev;
  };

  // Show modal and toast only AFTER logs have finished displaying
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (logsFinished && status === 'completed') {
      // Get claims info for toast
      const claims = syncData?.claimsDetected || 0;
      const value = syncData?.totalRecoverableValue || (claims * 48);
      const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      
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
  useDetectionUpdates(
    status === 'completed' && syncId ? syncId : null,
    (event) => {
      // Handle detection updates - don't show toasts here, main completion flow handles it
      if (event.status === 'complete') {
        const totalDetections = event.total_detections || 0;
        if (totalDetections > 0) {
          const estimatedValue = event.estimated_value || (totalDetections * 48);
          const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
          addLog({ type: 'success', category: 'detection', message: `Recoveries identified: ${formattedValue} from ${totalDetections} discrepancies` }, 1200);
          
          // ⭐ UPDATE syncData so "Potential Recovery Identified" shows when logsFinished
          setSyncData(prev => prev ? {
            ...prev,
            claimsDetected: totalDetections,
            totalRecoverableValue: estimatedValue
          } : prev);
          // Toast will be shown when logsFinished becomes true
        } else {
          addLog({ type: 'info', category: 'detection', message: 'Detection complete - no discrepancies found' }, 800);
        }
      } else if (event.new_detections_count && event.new_detections_count > 0) {
        const estimatedValue = event.estimated_value || (event.new_detections_count * 48);
        const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
        addLog({ type: 'info', category: 'detection', message: `New: +${formattedValue} potential recovery` }, 800);
        
        // ⭐ UPDATE syncData for incremental updates too
        setSyncData(prev => prev ? {
          ...prev,
          claimsDetected: (prev.claimsDetected || 0) + event.new_detections_count,
          totalRecoverableValue: (prev.totalRecoverableValue || 0) + estimatedValue
        } : prev);
        // Toast will be shown when logsFinished becomes true
      }
    }
  );

  const updateSyncState = (s: SyncStatusResponse) => {
    setSyncData(s);
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
        // Queue completion logs - toast and modal will show after these finish
        addLog({ type: 'thinking', category: 'system', message: 'Finalizing everything... wrapping up the analysis' }, 800);
        addLog({ type: 'success', category: 'system', message: '[COMPLETE] All data synchronized and analyzed' }, 1500);
        addLog({ type: 'thinking', category: 'system', message: 'Done. Your potential recoveries are ready for review' }, 1200);
        // Mark that completion logs have been queued - logsFinished will be set when queue empties
        completionLogsAddedRef.current = true;
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
          
          addLog({ type: 'info', category: 'system', message: 'Connecting to Amazon SP-API Secure Tunnel...', thinkingDuration: 2 }, 0);
          
          const start = await startSync();
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };
          
          addLog({ type: 'success', category: 'system', message: '[CONNECTED] Secure tunnel established' }, 1500);
          addLog({ type: 'thinking', category: 'system', message: 'Good... connection is stable. Let me access your seller data' }, 1200);
          addLog({ type: 'info', category: 'system', message: 'Requesting access to Seller Central ledger...', thinkingDuration: 3 }, 1400);
          addLog({ type: 'thinking', category: 'system', message: 'I\'ll need to scan the last 18 months of transactions' }, 1100);
          addLog({ type: 'info', category: 'system', message: 'Scanning 18-month transaction window...', thinkingDuration: 4 }, 1600);
          addLog({ type: 'thinking', category: 'system', message: 'This is where discrepancies often hide... let me dig in' }, 1300);
          
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
            const detectedCount = s.claimsDetected || 0;
            const estimatedValue = detectedCount * 48; // ~$48 avg per claim
            
            // ⭐ UPDATE syncData - but DON'T show toast here, let the main completion flow handle it
            setSyncData(prev => prev ? {
              ...prev,
              claimsDetected: detectedCount,
              totalRecoverableValue: estimatedValue
            } : prev);
            
            if (detectedCount > 0) {
              const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
              addLog({ type: 'success', category: 'detection', message: `Recoveries: ${formattedValue} from ${detectedCount} discrepancies`, count: detectedCount }, 1200);
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

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Cancelled</Badge>;
      case 'detecting':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Detecting Discrepancies</Badge>;
      case 'running':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Running</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Idle</Badge>;
    }
  };

  // Get log entry color
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'progress': return 'text-blue-400';
      case 'thinking': return 'text-gray-500 italic';
      default: return 'text-gray-300';
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

  // Calculate potential recoverable value
  // Use backend value if available, otherwise estimate based on claims
  // Average Amazon FBA claim ~$48-75 (conservative estimate)
  const AVERAGE_CLAIM_VALUE = 48;
  const claimsCount = syncData?.claimsDetected || 0;
  const totalRecoverableValue = syncData?.totalRecoverableValue || (claimsCount * AVERAGE_CLAIM_VALUE);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <PageLayout title="Sync Log" hideNavbar hideSidebar plainBackground logoFontFamily='"Nunito Sans", sans-serif'>
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-6 py-10 text-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Section - No Card, content flows naturally */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                    {getStatusIcon()}
                <h1 className="text-xl font-semibold text-gray-900">Sync Log</h1>
              </div>
              <p className="text-sm text-gray-500">
                    First run window: last 18 months • Schedule: daily at 02:00 UTC
              </p>
            </div>

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

              {/* Potential Recovery Value - The Hero Number - Only show after logs finish */}
              {((status === 'completed' && logsFinished) || status === 'detecting') && claimsCount > 0 && (
                <div className="py-4">
                  <p className="text-sm text-gray-500 mb-1">Potential Recovery Identified</p>
                  <p className={`text-xl font-semibold text-gray-900 ${status === 'detecting' ? 'animate-pulse' : ''}`}>
                    {formatCurrency(totalRecoverableValue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Based on {claimsCount.toLocaleString()} detected discrepancies
                  </p>
                </div>
              )}

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                              <p className="text-sm text-gray-600">
                    {status === 'detecting'
                      ? 'Running AI detection on synced data...'
                      : status === 'completed' && logsFinished && claimsCount > 0
                        ? `Analysis complete — ${claimsCount.toLocaleString()} recoverable items found`
                        : status === 'completed' && logsFinished && totalItemsSynced > 0
                          ? `Sync completed — ${totalItemsSynced.toLocaleString()} records analyzed`
                          : status === 'completed' && !logsFinished
                            ? 'Finalizing analysis...'
                            : message}
                  </p>
                      </div>
                      {getStatusBadge()}
                    </div>
                    
                    <Progress value={progress} className="h-1" />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{progress}%</span>
                        {syncData && (
                          <div className="flex items-center gap-4 text-xs">
                            {syncData.ordersProcessed !== undefined && syncData.totalOrders !== undefined && (
                        <span>
                                {syncData.ordersProcessed.toLocaleString()} / {syncData.totalOrders.toLocaleString()} orders
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

              {/* Sync Summary Grid - Data Types Only */}
              {syncData && (status === 'completed' || status === 'running' || status === 'detecting') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: 'Orders', value: syncData.ordersProcessed, icon: Package },
                    { label: 'Inventory', value: syncData.inventoryCount, icon: Archive },
                    { label: 'Shipments', value: syncData.shipmentsCount, icon: Truck },
                    { label: 'Returns', value: syncData.returnsCount, icon: RotateCcw },
                    { label: 'Settlements', value: syncData.settlementsCount, icon: DollarSign },
                    { label: 'Fees', value: syncData.feesCount, icon: DollarSign },
                  ].filter(item => item.value !== undefined && item.value > 0).map((item) => (
                    <div 
                      key={item.label} 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-gray-100 text-gray-600"
                    >
                      <item.icon className="h-3 w-3" />
                      <span className="font-medium">{item.value?.toLocaleString()}</span>
                      <span className="text-gray-400">{item.label}</span>
                            </div>
                  ))}
                          </div>
              )}

              {/* Real-time Logs Section */}
              <div className="space-y-3 pt-6 mt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">Activity Log</h4>
                  <span className="text-xs text-gray-400">{filteredLogs.length} entries</span>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search logs... (shipments, inventory, orders, etc.)"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  />
                            </div>
                
                {/* Log Container - Terminal Style */}
                <div 
                  ref={logContainerRef}
                  className="bg-[#1f1f1f] rounded-lg p-4 font-mono text-xs h-72 overflow-y-auto scroll-smooth"
                >
                  {filteredLogs.length === 0 ? (
                    <div className="text-gray-500 flex items-center justify-center h-full">
                      {logs.length === 0 ? 'Waiting for sync to start...' : 'No logs match your search'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredLogs.map((log) => (
                        <div key={log.id} className="flex flex-col">
                          <div className={`flex flex-wrap sm:flex-nowrap items-start gap-1 sm:gap-2 hover:bg-gray-800/50 px-1 rounded ${log.type === 'thinking' ? 'opacity-70' : ''}`}>
                            {/* Timestamp - hidden on mobile, shown on sm+ */}
                            <span className="hidden sm:inline text-gray-500 shrink-0 select-none">
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {/* Short time on mobile only */}
                            <span className="sm:hidden text-gray-500 shrink-0 select-none text-[10px]">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span className="text-cyan-500 shrink-0 select-none font-medium text-[10px] sm:text-xs">
                              sync agent
                            </span>
                            <span className={`${getLogColor(log.type)} break-words min-w-0 flex-1`}>
                              {log.message}
                            </span>
                          </div>
                          {/* "flagged" indicator after thinking logs */}
                          {log.type === 'thinking' && (
                            <div className="ml-1 mt-0.5 mb-1">
                              <span className="text-[10px] text-yellow-500/70 font-medium">
                                flagged
                              </span>
                            </div>
                          )}
                          {/* Thought for Xs indicator - shown after info/progress logs */}
                          {log.thinkingDuration && (
                            <div className="ml-1 mt-0.5 mb-1">
                              <span className="text-[10px] text-gray-600 italic">
                                Thought for {log.thinkingDuration}s
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {status === 'running' && (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 text-blue-400 animate-pulse">
                          <span className="hidden sm:inline text-gray-500 shrink-0 select-none">
                            {formatTimestamp(new Date())}
                          </span>
                          <span className="sm:hidden text-gray-500 shrink-0 select-none text-[10px]">
                            {new Date().toLocaleTimeString()}
                          </span>
                          <span className="text-cyan-500 shrink-0 select-none font-medium text-[10px] sm:text-xs">
                            sync agent
                          </span>
                          <span>Processing...</span>
                          </div>
                      )}
                            </div>
                              )}
                          </div>
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
                        Go to Dashboard
                      </Button>
                    </div>

              {/* Document Sources Modal */}
              <Dialog open={showSourcesModal} onOpenChange={setShowSourcesModal}>
                <DialogContent className="sm:max-w-md bg-white rounded-md">
                  <DialogHeader className="pb-3">
                    <DialogTitle className="text-lg font-semibold text-gray-900">Link Sources for Document Ingestion</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      Read-only access. No writing or sending permissions.
                    </DialogDescription>
                  </DialogHeader>
                  
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
                  
                  <div className="flex justify-center pt-1">
                    <Button
                      variant="ghost"
                      onClick={() => setShowSourcesModal(false)}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Advanced integrations
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            </div>
          </div>
        </div>
    </PageLayout>
  );
}
