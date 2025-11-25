import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { startSync, getSyncStatus, cancelSync, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2, Search, Package, Truck, RotateCcw, DollarSign, Archive, Target, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDetectionUpdates } from '@/hooks/use-detection-updates';

// Log entry type
interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress';
  category: 'orders' | 'inventory' | 'shipments' | 'returns' | 'settlements' | 'fees' | 'claims' | 'detection' | 'system';
  message: string;
  count?: number;
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
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [message, setMessage] = useState<string>('Initializing sync...');
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const previousStatusRef = useRef<'idle' | 'running' | 'completed' | 'failed' | 'cancelled'>('idle');
  const toastShownRef = useRef<{ started?: boolean; completed?: boolean; failed?: boolean; cancelled?: boolean }>({});
  const [showConnectCard, setShowConnectCard] = useState(false);
  const connectCardTimeoutRef = useRef<number | null>(null);
  
  // Log system state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<DataTypeStatus>({
    orders: { syncing: false, completed: false, count: 0 },
    inventory: { syncing: false, completed: false, count: 0 },
    shipments: { syncing: false, completed: false, count: 0 },
    returns: { syncing: false, completed: false, count: 0 },
    settlements: { syncing: false, completed: false, count: 0 },
    fees: { syncing: false, completed: false, count: 0 },
    claims: { syncing: false, completed: false, count: 0 },
  });

  // Add a log entry
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setLogs(prev => [...prev, newEntry]);
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const searchLower = logSearch.toLowerCase();
    return logs.filter(log => 
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  }, [logs, logSearch]);

  // Update logs based on sync data changes
  const updateLogsFromSyncData = (data: SyncStatusResponse) => {
    const prev = previousDataRef.current;
    
    // Check orders
    if (data.ordersProcessed && data.ordersProcessed > 0 && !prev.orders.completed) {
      if (!prev.orders.syncing) {
        addLog({ type: 'progress', category: 'orders', message: 'Syncing orders from Amazon SP-API...' });
        prev.orders.syncing = true;
      }
      if (data.ordersProcessed >= (data.totalOrders || data.ordersProcessed)) {
        addLog({ type: 'success', category: 'orders', message: `✓ Orders synced: ${data.ordersProcessed.toLocaleString()} orders processed`, count: data.ordersProcessed });
        prev.orders.completed = true;
        prev.orders.count = data.ordersProcessed;
      }
    }
    
    // Check inventory
    if (data.inventoryCount && data.inventoryCount > 0 && !prev.inventory.completed) {
      if (!prev.inventory.syncing) {
        addLog({ type: 'progress', category: 'inventory', message: 'Syncing inventory levels...' });
        prev.inventory.syncing = true;
      }
      addLog({ type: 'success', category: 'inventory', message: `✓ Inventory synced: ${data.inventoryCount.toLocaleString()} items`, count: data.inventoryCount });
      prev.inventory.completed = true;
      prev.inventory.count = data.inventoryCount;
    }
    
    // Check shipments
    if (data.shipmentsCount && data.shipmentsCount > 0 && !prev.shipments.completed) {
      if (!prev.shipments.syncing) {
        addLog({ type: 'progress', category: 'shipments', message: 'Syncing inbound shipments...' });
        prev.shipments.syncing = true;
      }
      addLog({ type: 'success', category: 'shipments', message: `✓ Shipments synced: ${data.shipmentsCount.toLocaleString()} shipments`, count: data.shipmentsCount });
      prev.shipments.completed = true;
      prev.shipments.count = data.shipmentsCount;
    }
    
    // Check returns
    if (data.returnsCount && data.returnsCount > 0 && !prev.returns.completed) {
      if (!prev.returns.syncing) {
        addLog({ type: 'progress', category: 'returns', message: 'Syncing customer returns...' });
        prev.returns.syncing = true;
      }
      addLog({ type: 'success', category: 'returns', message: `✓ Returns synced: ${data.returnsCount.toLocaleString()} returns`, count: data.returnsCount });
      prev.returns.completed = true;
      prev.returns.count = data.returnsCount;
    }
    
    // Check settlements
    if (data.settlementsCount && data.settlementsCount > 0 && !prev.settlements.completed) {
      if (!prev.settlements.syncing) {
        addLog({ type: 'progress', category: 'settlements', message: 'Syncing settlement reports...' });
        prev.settlements.syncing = true;
      }
      addLog({ type: 'success', category: 'settlements', message: `✓ Settlements synced: ${data.settlementsCount.toLocaleString()} settlements`, count: data.settlementsCount });
      prev.settlements.completed = true;
      prev.settlements.count = data.settlementsCount;
    }
    
    // Check fees
    if (data.feesCount && data.feesCount > 0 && !prev.fees.completed) {
      if (!prev.fees.syncing) {
        addLog({ type: 'progress', category: 'fees', message: 'Syncing FBA fees...' });
        prev.fees.syncing = true;
      }
      addLog({ type: 'success', category: 'fees', message: `✓ Fees synced: ${data.feesCount.toLocaleString()} fee records`, count: data.feesCount });
      prev.fees.completed = true;
      prev.fees.count = data.feesCount;
    }
    
    // Check claims detected
    if (data.claimsDetected && data.claimsDetected > 0 && !prev.claims.completed) {
      addLog({ type: 'success', category: 'claims', message: `✓ Claims detected: ${data.claimsDetected.toLocaleString()} potential recoveries found`, count: data.claimsDetected });
      prev.claims.completed = true;
      prev.claims.count = data.claimsDetected;
    }
    
    previousDataRef.current = prev;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (status === 'completed') {
      if (connectCardTimeoutRef.current) {
        window.clearTimeout(connectCardTimeoutRef.current);
      }
      connectCardTimeoutRef.current = window.setTimeout(() => {
        setShowConnectCard(true);
      }, 500);
    } else {
      if (connectCardTimeoutRef.current) {
        window.clearTimeout(connectCardTimeoutRef.current);
        connectCardTimeoutRef.current = null;
      }
      setShowConnectCard(false);
    }

    return () => {
      if (connectCardTimeoutRef.current) {
        window.clearTimeout(connectCardTimeoutRef.current);
        connectCardTimeoutRef.current = null;
      }
    };
  }, [status]);
  
  // Phase 3: Detection updates SSE - connect when sync completes
  useDetectionUpdates(
    status === 'completed' && syncId ? syncId : null,
    (event) => {
      // Handle detection updates
      if (event.status === 'complete') {
        addLog({ type: 'success', category: 'detection', message: `Detection complete: ${event.total_detections || 0} anomalies identified` });
        toast({
          title: 'Detection Complete',
          description: event.message || `Detection completed. ${event.total_detections || 0} anomalies found.`,
          duration: 6000,
        });
      } else if (event.new_detections_count && event.new_detections_count > 0) {
        addLog({ type: 'info', category: 'detection', message: `New detection: ${event.new_detections_count} anomalies found` });
        toast({
          title: 'New Detections',
          description: `${event.new_detections_count} new anomaly${event.new_detections_count !== 1 ? 'ies' : ''} detected`,
          duration: 5000,
        });
      }
    }
  );

  const updateSyncState = (s: SyncStatusResponse) => {
    setSyncData(s);
    if (typeof s.progress === 'number') setProgress(s.progress);
    if (s.message) setMessage(s.message);
    
    // Update logs based on sync data
    updateLogsFromSyncData(s);
    
    // Map status values to match documentation
    const mappedStatus = s.status === 'idle' ? 'idle' :
                        s.status === 'running' ? 'running' :
                        s.status === 'completed' ? 'completed' :
                        s.status === 'failed' ? 'failed' :
                        s.status === 'cancelled' ? 'cancelled' : 'idle';
    
    // Show toast notifications on status changes
    if (mappedStatus !== previousStatusRef.current) {
      previousStatusRef.current = mappedStatus;
      
      // Show toast for status transitions
      if (mappedStatus === 'completed' && !toastShownRef.current.completed) {
        toastShownRef.current.completed = true;
        addLog({ type: 'success', category: 'system', message: `Sync completed successfully` });
        toast({
          title: 'Sync Complete',
          description: 'Complete successfully. See dashboard.',
          duration: 5000,
        });
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
          // Clear logs for new sync
          setLogs([]);
          previousDataRef.current = {
            orders: { syncing: false, completed: false, count: 0 },
            inventory: { syncing: false, completed: false, count: 0 },
            shipments: { syncing: false, completed: false, count: 0 },
            returns: { syncing: false, completed: false, count: 0 },
            settlements: { syncing: false, completed: false, count: 0 },
            fees: { syncing: false, completed: false, count: 0 },
            claims: { syncing: false, completed: false, count: 0 },
          };
          
          addLog({ type: 'info', category: 'system', message: 'Initializing Amazon data sync...' });
          
          const start = await startSync();
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };
          
          addLog({ type: 'info', category: 'system', message: `Sync started (ID: ${newSyncId.slice(0, 20)}...)` });
          addLog({ type: 'info', category: 'system', message: 'Fetching data from last 18 months...' });
          
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
            setSyncData(prev => prev ? {
              ...prev,
              claimsDetected: s.claimsDetected ?? prev.claimsDetected
            } : prev);
            
            if (s.claimsDetected > 0) {
              addLog({ type: 'success', category: 'detection', message: `✓ Detection complete: ${s.claimsDetected} claims detected and ready for review`, count: s.claimsDetected });
              toast({
                title: 'Detection Complete',
                description: `${s.claimsDetected} claims detected and ready for review.`,
                duration: 5000,
              });
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

    // Polling fallback
    let pollsAfterComplete = 0;
    const MAX_POLLS_AFTER_COMPLETE = 5;
    
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

  return (
    <PageLayout title="Smart Inventory Sync" hideNavbar hideSidebar plainBackground>
      <div className="bg-white">
        <div className="container mx-auto px-6 py-10 text-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon()}
                  Ledgers, Shipments, Returns Syncing
                </CardTitle>
                <CardDescription className="text-gray-500">
                  First run window: last 18 months • Schedule: daily at 02:00 UTC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {status === 'completed' && totalItemsSynced > 0
                          ? `Sync completed successfully - ${totalItemsSynced.toLocaleString()} items synced`
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
                          {syncData.claimsDetected !== undefined && syncData.claimsDetected > 0 && (
                            <span className="text-emerald-600 font-medium">
                              {syncData.claimsDetected.toLocaleString()} claims detected
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {totalItemsSynced > 0 && (
                      <span className="text-xs text-gray-500">
                        {totalItemsSynced.toLocaleString()} items synced
                      </span>
                    )}
                  </div>

                  {/* Sync Summary Grid */}
                  {syncData && (status === 'completed' || status === 'running') && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                      {[
                        { label: 'Orders', value: syncData.ordersProcessed, icon: Package },
                        { label: 'Inventory', value: syncData.inventoryCount, icon: Archive },
                        { label: 'Shipments', value: syncData.shipmentsCount, icon: Truck },
                        { label: 'Returns', value: syncData.returnsCount, icon: RotateCcw },
                        { label: 'Settlements', value: syncData.settlementsCount, icon: DollarSign },
                        { label: 'Fees', value: syncData.feesCount, icon: DollarSign },
                        { label: 'Claims', value: syncData.claimsDetected, icon: Target, highlight: true },
                      ].filter(item => item.value !== undefined && item.value > 0).map((item) => (
                        <div 
                          key={item.label} 
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                            item.highlight 
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                              : 'bg-gray-50 border border-gray-200 text-gray-700'
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          <span className="font-medium">{item.value?.toLocaleString()}</span>
                          <span className="text-gray-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Real-time Logs Section */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800">Sync Logs</h4>
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
                      className="bg-gray-900 rounded-md p-4 font-mono text-xs h-64 overflow-y-auto scroll-smooth"
                    >
                      {filteredLogs.length === 0 ? (
                        <div className="text-gray-500 flex items-center justify-center h-full">
                          {logs.length === 0 ? 'Waiting for sync to start...' : 'No logs match your search'}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2 hover:bg-gray-800/50 px-1 rounded">
                              <span className="text-gray-500 shrink-0 select-none">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              <span className={`shrink-0 ${getLogColor(log.type)}`}>
                                {getCategoryIcon(log.category)}
                              </span>
                              <span className={`${getLogColor(log.type)} break-all`}>
                                {log.message}
                              </span>
                            </div>
                          ))}
                          {status === 'running' && (
                            <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                              <span className="text-gray-500 shrink-0 select-none">
                                {formatTimestamp(new Date())}
                              </span>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
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

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
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

                  <div className="flex flex-wrap items-center gap-2">
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

                  {showConnectCard && (
                    <div className="mt-4 p-3 rounded border border-blue-200 bg-blue-50 text-xs text-blue-700">
                      Connect Gmail, Outlook, Dropbox or Google Drive so Clario will start.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
