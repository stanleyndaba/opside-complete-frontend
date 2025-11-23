import React, { useEffect, useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { startSync, getSyncStatus, cancelSync, getSyncHistory, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDetectionUpdates } from '@/hooks/use-detection-updates';

const LOG_SEQUENCE = [
  {
    id: 'inventory',
    status: 'Syncing inventory history...',
    lines: [
      'Fetching last 18 months of Inventory History...',
      'Buffering 48 ledger exports...',
      'Normalizing FNSKU-level quantities...'
    ]
  },
  {
    id: 'transactions',
    status: 'Scanning transaction ledgers...',
    lines: [
      '14,205 Transactions Found...',
      'Auditing settlements vs payouts...',
      'Tagging reimbursable events...'
    ]
  },
  {
    id: 'shipments',
    status: 'Syncing shipment receipts...',
    lines: [
      'Cross-referencing Shipment IDs...',
      'Verifying inbound shortages & damages...',
      'Matching FC receiving logs...'
    ]
  },
  {
    id: 'returns',
    status: 'Auditing returns & refunds...',
    lines: [
      'Pairing customer refunds with units returned...',
      'Checking “refunded but never received” anomalies...',
      'Tracking refurbishment deductions...'
    ]
  },
  {
    id: 'settlements',
    status: 'Reconciling settlements & fees...',
    lines: [
      'Reconciling deposit statements...',
      'Scanning weight & dimension fee swings...',
      'Matching reimbursements to deposit ledger...'
    ]
  },
  {
    id: 'claims',
    status: 'Queuing claims & alerts...',
    lines: [
      'Flagging variance thresholds...',
      'Generating claim packets...',
      'Awaiting final push to dashboard...'
    ]
  }
];

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
  const [logStepIndex, setLogStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLogStepIndex((prev) => (prev + 1) % LOG_SEQUENCE.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);
  
  // Phase 3: Detection updates SSE - connect when sync completes
  useDetectionUpdates(
    status === 'completed' && syncId ? syncId : null,
    (event) => {
      // Handle detection updates
      if (event.status === 'complete') {
        toast({
          title: 'Detection Complete',
          description: event.message || `Detection completed. ${event.total_detections || 0} anomalies found.`,
          duration: 6000,
        });
      } else if (event.new_detections_count && event.new_detections_count > 0) {
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
    
    // Map status values to match documentation
    const mappedStatus = s.status === 'idle' ? 'idle' :
                        s.status === 'running' ? 'running' :
                        s.status === 'completed' ? 'completed' :
                        s.status === 'failed' ? 'failed' :
                        s.status === 'cancelled' ? 'cancelled' : 'idle';
    
    // Show toast notifications on status changes
    if (mappedStatus !== previousStatusRef.current) {
      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = mappedStatus;
      
      // Show toast for status transitions
      if (mappedStatus === 'completed' && !toastShownRef.current.completed) {
        toastShownRef.current.completed = true;
        const claimsCount = s.claimsDetected ?? 0;
        const ordersProcessed = s.ordersProcessed ?? 0;
        const totalOrders = s.totalOrders ?? 0;
        
        toast({
          title: 'Sync Complete',
          description: 'Complete successfully. See dashboard.',
          duration: 5000,
        });
      } else if (mappedStatus === 'failed' && !toastShownRef.current.failed) {
        toastShownRef.current.failed = true;
        toast({
          title: 'Sync Failed',
          description: s.error || s.message || 'The sync encountered an error. Please try again.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        // Show toast for cancelled status (only if not already shown)
        // This handles cancellation from SSE/polling, not just from handleCancelSync button
        toastShownRef.current.cancelled = true;
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
          const start = await startSync();
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };
          
          // Show toast for sync start
          toast({
            title: 'Sync Started',
            description: 'Your Amazon data sync has started. This may take a few minutes.',
            duration: 4000,
          });
          
          // Update URL with syncId (use replace to avoid adding to history)
          navigate(`/sync?id=${newSyncId}`, { replace: true });
        } catch (e: any) {
          if (cancelled) return;
          setStatus('failed');
          setMessage(e?.message || 'Failed to start sync');
          setError(e?.message || 'Failed to start sync');
          previousStatusRef.current = 'failed';
          
          // Show error toast
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
          const s = await getSyncStatus(syncId);
          if (cancelled) return;
          
          // Debug: Log what we received
          console.log('[Sync] Received sync status:', {
            syncId: s.syncId,
            status: s.status,
            ordersProcessed: s.ordersProcessed,
            totalOrders: s.totalOrders,
            inventoryCount: s.inventoryCount,
            shipmentsCount: s.shipmentsCount,
            returnsCount: s.returnsCount,
            settlementsCount: s.settlementsCount,
            feesCount: s.feesCount,
            claimsDetected: s.claimsDetected
          });
          
          updateSyncState(s);
        } catch (e: any) {
          if (cancelled) return;
          console.error('Failed to load sync status:', e);
          const errorMessage = e?.message || 'Failed to load sync status';
          
          // If sync not found, clear the syncId and state
          if (errorMessage.includes('not found') || errorMessage.includes('Sync not found')) {
            setSyncId(undefined);
            setSyncData(null);
            setStatus('idle');
            setProgress(0);
            setMessage('Sync not found. Please start a new sync.');
            setError(null);
            // Clear syncId from URL
            navigate('/sync', { replace: true });
            
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
          updateSyncState(s);
          
          if (s.status === 'completed') {
            setMessage(s.message || 'Sync completed successfully');
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            // Don't auto-navigate, let user see the results
          } else if (s.status === 'failed' || s.status === 'cancelled') {
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

    // Polling fallback (runs in parallel with SSE)
    interval = setInterval(async () => {
      if (!syncId || cancelled) return;
      try {
        const s = await getSyncStatus(syncId);
        if (cancelled) return;
        updateSyncState(s);
        
        if (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled') {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        // If sync not found during polling, stop polling and clear state
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
  }, [syncId, navigate]); // toast is stable and doesn't need to be in dependencies

  const handleCancelSync = async () => {
    if (!syncId || status !== 'running') return;
    
    setIsCancelling(true);
    try {
      await cancelSync(syncId);
      setStatus('cancelled');
      setMessage('Sync cancelled');
      previousStatusRef.current = 'cancelled';
      toastShownRef.current.cancelled = true;
      
      // Show toast immediately for user feedback
      toast({
        title: 'Sync Cancelled',
        description: 'The sync has been cancelled successfully.',
        duration: 4000,
      });
      
      // Refresh status to get latest state (toast in updateSyncState won't show since we already showed it)
      const s = await getSyncStatus(syncId);
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
    // Reset state
    setSyncId(undefined);
    setProgress(0);
    setStatus('idle');
    setMessage('Initializing sync...');
    setError(null);
    setSyncData(null);
    previousStatusRef.current = 'idle';
    toastShownRef.current = {};
    
    // Show toast
    toast({
      title: 'Retrying Sync',
      description: 'Starting a new sync...',
      duration: 3000,
    });
    
    // Reload to restart sync
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

  return (
    <PageLayout title="Smart Inventory Sync" hideNavbar hideSidebar plainBackground>
      <div className="bg-white">
        <div className="container mx-auto px-6 py-10 text-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-white border border-gray-200 text-gray-900 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon()}
                    Ledgers, Shipments, Returns Syncing.
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    First run window: last 18 months • Schedule: daily at 02:00 UTC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {syncData && status === 'completed' && (() => {
                          const ordersProcessed = syncData.ordersProcessed || 0;
                          const inventoryCount = syncData.inventoryCount || 0;
                          const shipmentsCount = syncData.shipmentsCount || 0;
                          const returnsCount = syncData.returnsCount || 0;
                          const settlementsCount = syncData.settlementsCount || 0;
                          const feesCount = syncData.feesCount || 0;
                          const totalItemsSynced = 
                            ordersProcessed +
                            inventoryCount +
                            shipmentsCount +
                            returnsCount +
                            settlementsCount +
                            feesCount;
                          
                          // Use calculated total if available, otherwise fall back to message
                          if (totalItemsSynced > 0) {
                            return (
                              <p className="text-sm text-gray-600">
                                Sync completed successfully - {totalItemsSynced.toLocaleString()} items synced
                              </p>
                            );
                          }
                          return <p className="text-sm text-gray-600">{message}</p>;
                        })()}
                        {(!syncData || status !== 'completed') && (
                          <p className="text-sm text-gray-600">{message}</p>
                        )}
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
                              <span className="text-xs">
                                {syncData.ordersProcessed.toLocaleString()} / {syncData.totalOrders.toLocaleString()} orders
                              </span>
                            )}
                            {syncData.claimsDetected !== undefined && (
                              <span className="text-emerald-600 font-medium text-xs">
                                {syncData.claimsDetected.toLocaleString()} claims detected
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {syncData && status === 'completed' && (() => {
                        const ordersProcessed = syncData.ordersProcessed || 0;
                        const inventoryCount = syncData.inventoryCount || 0;
                        const shipmentsCount = syncData.shipmentsCount || 0;
                        const returnsCount = syncData.returnsCount || 0;
                        const settlementsCount = syncData.settlementsCount || 0;
                        const feesCount = syncData.feesCount || 0;
                        const totalItemsSynced =
                          ordersProcessed +
                          inventoryCount +
                          shipmentsCount +
                          returnsCount +
                          settlementsCount +
                          feesCount;
                        return (
                          <span className="text-xs text-gray-500">
                            {totalItemsSynced.toLocaleString()} items synced
                          </span>
                        );
                      })()}
                    </div>

                    {/* Sync Details Breakdown - Calculate total items synced */}
                    {syncData && status === 'completed' && (() => {
                      const ordersProcessed = syncData.ordersProcessed || 0;
                      const inventoryCount = syncData.inventoryCount || 0;
                      const shipmentsCount = syncData.shipmentsCount || 0;
                      const returnsCount = syncData.returnsCount || 0;
                      const settlementsCount = syncData.settlementsCount || 0;
                      const feesCount = syncData.feesCount || 0;
                      const claimsDetected = syncData.claimsDetected || 0;
                      
                      // Check if this is an old sync with incomplete metadata
                      const isOldSyncFormat = ordersProcessed > 0 && inventoryCount === 0 && shipmentsCount === 0 && 
                                             returnsCount === 0 && settlementsCount === 0 && feesCount === 0;
                      
                      // Calculate total items synced (sum of all data types)
                      const totalItemsSynced = 
                        ordersProcessed +
                        inventoryCount +
                        shipmentsCount +
                        returnsCount +
                        settlementsCount +
                        feesCount;
                      
                      // Only show breakdown if we have data
                      if (totalItemsSynced === 0 && !inventoryCount && !shipmentsCount && !returnsCount && !settlementsCount) {
                        return null;
                      }
                      
                      // Show warning if old sync format
                      if (isOldSyncFormat) {
                        return (
                          <div className="space-y-4 pt-4 border-t border-amber-200">
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                              <p className="text-sm font-medium text-amber-800 mb-2">
                                ⚠️ Old Sync Format Detected
                              </p>
                              <p className="text-xs text-amber-700 mb-3">
                                This sync was created before we added detailed data type counts. The counts shown may be incomplete.
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSyncId(undefined);
                                  navigate('/sync', { replace: true });
                                  toast({
                                    title: 'Start New Sync',
                                    description: 'Please click "Start Sync" to create a new sync with complete data.',
                                    duration: 5000,
                                  });
                                }}
                                className="border-amber-300 text-amber-800 hover:bg-amber-50"
                              >
                                Start New Sync
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      
                      const currentLog = LOG_SEQUENCE[logStepIndex];

                      return (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">Log</h4>
                              <p className="text-xs text-gray-500">{currentLog.status}</p>
                            </div>
                            <div className="bg-gray-900 text-emerald-200 rounded-md p-4 font-mono text-xs space-y-2">
                              {currentLog.lines.map((entry, index) => (
                                <p key={`${currentLog.id}-${index}`} className="tracking-tight">
                                  {entry}
                                </p>
                              ))}
                              {currentLog.id === 'claims' && claimsDetected !== undefined && claimsDetected > 0 && (
                                <p className="tracking-tight text-emerald-400">
                                  {claimsDetected.toLocaleString()} claims detected and queued.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {error && (
                      <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
                        <strong>Error:</strong> {error}
                      </div>
                    )}

                    {syncData?.startedAt && (
                      <div className="text-xs text-gray-600">
                        Started: {new Date(syncData.startedAt).toLocaleString()}
                      </div>
                    )}

                    {syncData?.completedAt && (
                      <div className="text-xs text-gray-600">
                        Completed: {new Date(syncData.completedAt).toLocaleString()}
                      </div>
                    )}

                    <div className="mt-4 p-3 rounded border border-blue-200 bg-blue-50 text-xs text-blue-700">
                      Connect Gmail, Outlook, Dropbox or Google Drive so Clario will start.
                    </div>

                    <div className="flex items-center gap-2">
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

                      {status === 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/app')}
                          className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                        >
                          Go to Dashboard
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
    </PageLayout>
  );
}

