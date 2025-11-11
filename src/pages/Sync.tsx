import React, { useEffect, useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { startSync, getSyncStatus, cancelSync, getSyncHistory, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SyncHistory } from '@/components/SyncHistory';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        
        if (claimsCount > 0) {
          toast({
            title: '✅ Sync Completed',
            description: `Sync completed successfully! ${claimsCount} claim${claimsCount !== 1 ? 's' : ''} detected from ${ordersProcessed.toLocaleString()} order${ordersProcessed !== 1 ? 's' : ''}.`,
            duration: 6000,
          });
        } else {
          toast({
            title: '✅ Sync Completed',
            description: `Sync completed successfully. Processed ${ordersProcessed.toLocaleString()} of ${totalOrders.toLocaleString()} orders.`,
            duration: 5000,
          });
        }
      } else if (mappedStatus === 'failed' && !toastShownRef.current.failed) {
        toastShownRef.current.failed = true;
        toast({
          title: '❌ Sync Failed',
          description: s.error || s.message || 'The sync encountered an error. Please try again.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        // Show toast for cancelled status (only if not already shown)
        // This handles cancellation from SSE/polling, not just from handleCancelSync button
        toastShownRef.current.cancelled = true;
        toast({
          title: '⏸️ Sync Cancelled',
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
            title: '🔄 Sync Started',
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
            title: '❌ Failed to Start Sync',
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
          updateSyncState(s);
        } catch (e: any) {
          if (cancelled) return;
          console.error('Failed to load sync status:', e);
          const errorMessage = e?.message || 'Failed to load sync status';
          setError(errorMessage);
          
          // Show error toast
          toast({
            title: '⚠️ Error Loading Sync Status',
            description: errorMessage || 'Failed to load sync status. Please refresh the page.',
            variant: 'destructive',
            duration: 5000,
          });
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
      } catch (err) {
        console.error('Polling error:', err);
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
        title: '⏸️ Sync Cancelled',
        description: 'The sync has been cancelled successfully.',
        duration: 4000,
      });
      
      // Refresh status to get latest state (toast in updateSyncState won't show since we already showed it)
      const s = await getSyncStatus(syncId);
      updateSyncState(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel sync');
      toast({
        title: '❌ Failed to Cancel Sync',
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
      title: '🔄 Retrying Sync',
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
    <PageLayout title="Smart Inventory Sync">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Inventory Sync
            </CardTitle>
            <CardDescription>
              First run window: last 12 months • Schedule: daily at 02:00 UTC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{message}</p>
                {getStatusBadge()}
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{progress}%</span>
                {syncData && (
                  <div className="flex items-center gap-4 text-xs">
                    {syncData.ordersProcessed !== undefined && syncData.totalOrders !== undefined && (
                      <span>
                        {syncData.ordersProcessed.toLocaleString()} / {syncData.totalOrders.toLocaleString()} orders
                      </span>
                    )}
                    {syncData.claimsDetected !== undefined && (
                      <span className="text-emerald-600 font-medium">
                        {syncData.claimsDetected.toLocaleString()} claims detected
                      </span>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {syncData?.startedAt && (
                <div className="text-xs text-muted-foreground">
                  Started: {new Date(syncData.startedAt).toLocaleString()}
                </div>
              )}

              {syncData?.completedAt && (
                <div className="text-xs text-muted-foreground">
                  Completed: {new Date(syncData.completedAt).toLocaleString()}
                </div>
              )}

              <div className="mt-4 p-3 rounded border border-blue-200 bg-blue-50 text-xs text-blue-900">
                Evidence ingestion is running in parallel. We're collecting supplier docs and linking proofs to detected claims.
              </div>

              <div className="flex items-center gap-2">
                {status === 'running' && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSync}
                    disabled={isCancelling}
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
                  <Button onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Sync
                  </Button>
                )}

                {status === 'completed' && (
                  <Button onClick={() => navigate('/app')}>
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <SyncHistory />
      </div>
    </PageLayout>
  );
}

