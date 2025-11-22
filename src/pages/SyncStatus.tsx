import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { getActiveSyncStatus } from '@/lib/inventoryApi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Mock data for development (per FRONTEND_AMAZON_OAUTH_SYNC_STATUS.md)
const MOCK_SYNC_STATUS = {
  hasActiveSync: false,
  lastSync: {
    id: 'sync_mock_123',
    status: 'completed',
    started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    completed_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
    progress: 100,
    message: 'Sync completed successfully - 321 items synced',
    ordersProcessed: 75,
    totalOrders: 75,
    inventoryCount: 75,        // ⭐ NEW
    shipmentsCount: 52,       // ⭐ NEW
    returnsCount: 37,         // ⭐ NEW
    settlementsCount: 45,     // ⭐ NEW
    feesCount: 0,            // ⭐ NEW
    claimsDetected: 37       // ⭐ UPDATED
  }
};

const MOCK_ACTIVE_SYNC = {
  hasActiveSync: true,
  lastSync: {
    id: 'sync_mock_456',
    status: 'running',
    started_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
    completed_at: null,
    progress: 45,
    message: 'Processing orders... 50 of 75 orders processed',
    ordersProcessed: 50,
    totalOrders: 75,
    inventoryCount: 40,       // ⭐ NEW
    shipmentsCount: 30,       // ⭐ NEW
    returnsCount: 20,         // ⭐ NEW
    settlementsCount: 25,     // ⭐ NEW
    feesCount: 0,            // ⭐ NEW
    claimsDetected: 0
  }
};

const MOCK_NO_SYNC = {
  hasActiveSync: false,
  lastSync: null
};

interface SyncStatusData {
  hasActiveSync: boolean;
  lastSync: {
    id: string;
    status: 'idle' | 'running' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    started_at: string;
    completed_at: string | null;
    progress: number;
    message?: string;
    ordersProcessed?: number;
    totalOrders?: number;
    inventoryCount?: number;      // ⭐ NEW
    shipmentsCount?: number;       // ⭐ NEW
    returnsCount?: number;         // ⭐ NEW
    settlementsCount?: number;     // ⭐ NEW
    feesCount?: number;            // ⭐ NEW
    claimsDetected?: number;
  } | null;
}

export default function SyncStatus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch sync status
  const fetchSyncStatus = async (options?: { useMock?: boolean; showLoading?: boolean }) => {
    const { useMock = false, showLoading = false } = options || {};
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      if (useMock) {
        // Use mock data
        setIsUsingMockData(true);
        setSyncStatus(MOCK_SYNC_STATUS as SyncStatusData);
        if (showLoading) setIsLoading(false);
        return;
      }

      const data = await getActiveSyncStatus();
      
      setIsUsingMockData(false);
      
      // Debug logging to see what we're getting from API
      console.log('[SyncStatus] API Response:', data);
      console.log('[SyncStatus] lastSync data:', data.lastSync);
      
      const rawLastSync = data.lastSync as any;
      const normalizedStatus =
        rawLastSync?.status === 'completed' ? 'completed' :
        rawLastSync?.status === 'running' || rawLastSync?.status === 'in_progress' ? 'running' :
        rawLastSync?.status === 'failed' ? 'failed' :
        rawLastSync?.status === 'cancelled' ? 'cancelled' : 'idle';
      const rawProgress = rawLastSync?.progress ?? rawLastSync?.progress_percent ?? 0;
      const normalizedProgress = normalizedStatus === 'completed' && rawProgress < 100 ? 100 : rawProgress;

      const mappedData: SyncStatusData = {
        hasActiveSync: data.hasActiveSync || false,
        lastSync: rawLastSync ? {
          id: rawLastSync.syncId || rawLastSync.id || '',
          status: normalizedStatus as any,
          started_at: rawLastSync.startedAt || rawLastSync.started_at || '',
          completed_at: rawLastSync.completedAt || rawLastSync.completed_at || null,
          progress: normalizedProgress,
          message: rawLastSync.message,
          ordersProcessed: rawLastSync.ordersProcessed ?? rawLastSync.orders_processed ?? 0,
          totalOrders: rawLastSync.totalOrders ?? rawLastSync.total_orders ?? 0,
          inventoryCount: rawLastSync.inventoryCount ?? rawLastSync.inventory_count ?? 0,
          shipmentsCount: rawLastSync.shipmentsCount ?? rawLastSync.shipments_count ?? 0,
          returnsCount: rawLastSync.returnsCount ?? rawLastSync.returns_count ?? 0,
          settlementsCount: rawLastSync.settlementsCount ?? rawLastSync.settlements_count ?? 0,
          feesCount: rawLastSync.feesCount ?? rawLastSync.fees_count ?? 0,
          claimsDetected: rawLastSync.claimsDetected ?? rawLastSync.claims_count ?? rawLastSync.claimsDetectedCount ?? rawLastSync.claims_detected ?? 0
        } : null
      };
      
      console.log('[SyncStatus] Mapped data:', mappedData);
      console.log('[SyncStatus] Breakdown values:', {
        ordersProcessed: mappedData.lastSync?.ordersProcessed,
        inventoryCount: mappedData.lastSync?.inventoryCount,
        shipmentsCount: mappedData.lastSync?.shipmentsCount,
        returnsCount: mappedData.lastSync?.returnsCount,
        settlementsCount: mappedData.lastSync?.settlementsCount,
        feesCount: mappedData.lastSync?.feesCount,
        claimsDetected: mappedData.lastSync?.claimsDetected
      });
      
      setSyncStatus(mappedData);
      if (showLoading) setIsLoading(false);
    } catch (error) {
      console.error('[SyncStatus] Failed to get sync status:', error);
      // Use mock data on error
      setIsUsingMockData(true);
      setSyncStatus(MOCK_SYNC_STATUS as SyncStatusData);
      if (showLoading) setIsLoading(false);
    }
  };

  // Initial fetch and polling setup
  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      // Poll sync status every 3 seconds if sync is active (per documentation)
      interval = setInterval(async () => {
        if (cancelled) return;
        
        // Always fetch latest status - the fetchSyncStatus function will check if we should use mock data
        await fetchSyncStatus();
      }, 3000); // Poll every 3 seconds
      
      setPollingInterval(interval);
    };

    // Initial fetch with loading state
    fetchSyncStatus({ showLoading: true }).then(() => {
      if (cancelled) return;
      startPolling();
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      setPollingInterval(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Stop polling when sync is complete or failed
  useEffect(() => {
    if (!syncStatus?.lastSync) return;
    
    const status = syncStatus.lastSync.status;
    
    // Stop polling when sync is done (but only if progress is 100 for completed status)
    const isActuallyComplete = status === 'completed' && syncStatus.lastSync.progress >= 100;
    if (isActuallyComplete || status === 'failed' || status === 'cancelled') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else if ((status === 'running' || status === 'in_progress' || (status === 'completed' && syncStatus.lastSync.progress < 100)) && !pollingInterval) {
      // Restart polling if sync becomes active again
      const interval = setInterval(async () => {
        await fetchSyncStatus();
      }, 3000);
      setPollingInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus?.lastSync?.status, isUsingMockData, pollingInterval]);

  const getStatusIcon = () => {
    if (!syncStatus?.lastSync) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    
    // If status is 'completed' but progress < 100, treat it as still running
    const effectiveStatus = (syncStatus.lastSync.status === 'completed' && syncStatus.lastSync.progress < 100)
      ? 'running'
      : syncStatus.lastSync.status;
    
    switch (effectiveStatus) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'running':
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    if (!syncStatus?.lastSync) {
      return <Badge variant="outline" className="border-gray-400 text-gray-400">No Sync History</Badge>;
    }
    
    // If status is 'completed' but progress < 100, treat it as still running
    const effectiveStatus = (syncStatus.lastSync.status === 'completed' && syncStatus.lastSync.progress < 100)
      ? 'running'
      : syncStatus.lastSync.status;
    
    switch (effectiveStatus) {
      case 'completed':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Cancelled</Badge>;
      case 'running':
      case 'in_progress':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Running</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Idle</Badge>;
    }
  };

  const getMinutesAgo = (dateString: string | null): number => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / 60000);
  };

  const displayStatus = syncStatus || MOCK_NO_SYNC;
  const lastSync = displayStatus.lastSync;

  if (isLoading) {
    return (
      <PageLayout title="Sync Status">
        <div className="flex min-h-[40vh] items-center justify-center bg-white text-gray-700">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            <span className="text-sm font-medium">Loading sync status…</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sync Status">
      <div className="bg-white">
        <div className="container mx-auto px-6 py-10 text-gray-900">
          <div className="max-w-4xl mx-auto space-y-6">
        {isUsingMockData && (
          <Card className="bg-yellow-500/10 border-yellow-500/40 text-yellow-100">
            <CardContent className="pt-6">
              <p className="text-sm">
                Using mock data (Backend unavailable - remove in production)
              </p>
            </CardContent>
          </Card>
        )}
              <Card className="bg-white/5 border-white/10 text-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Amazon Sync Status
            </CardTitle>
                  <CardDescription className="text-gray-300">
              Current synchronization status for your Amazon account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!lastSync ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-100">No Sync History</h3>
                        <p className="text-sm text-gray-300 mb-4">
                    No sync history yet. Start a sync to see status.
                  </p>
                  <Button onClick={() => navigate('/sync')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Sync
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status and Last Synced */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-200">Status</p>
                    {getStatusBadge()}
                  </div>
                  <div className="text-right space-y-1">
                          <p className="text-sm font-medium text-gray-200">Last Synced</p>
                          <p className="text-sm text-gray-400">
                      {lastSync.completed_at 
                        ? `${getMinutesAgo(lastSync.completed_at)} minutes ago`
                        : lastSync.started_at
                        ? `Started ${getMinutesAgo(lastSync.started_at)} minutes ago`
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar (if running or completed but progress < 100) */}
                {((lastSync.status === 'running' || lastSync.status === 'in_progress') || 
                  (lastSync.status === 'completed' && lastSync.progress < 100)) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">Progress</span>
                            <span className="font-medium text-gray-100">{lastSync.progress}%</span>
                    </div>
                    <Progress value={lastSync.progress} className="h-1" />
                    {lastSync.message && (
                            <p className="text-xs text-gray-300">{lastSync.message}</p>
                    )}
                  </div>
                )}

                {/* Sync Details - Calculate total items synced */}
                {(() => {
                  const ordersProcessed = lastSync.ordersProcessed || 0;
                  const totalOrders = lastSync.totalOrders || 0;

                  return (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="bg-blue-500/10 border border-blue-500/40 rounded-md p-4">
                        <p className="text-xs text-blue-100 mb-1">Orders Processed</p>
                        <p className="text-2xl font-bold text-blue-300">
                          {ordersProcessed.toLocaleString()} / {totalOrders.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Message */}
                {lastSync.message && lastSync.status !== 'running' && lastSync.status !== 'in_progress' && (
                  <div className={cn(
                          "p-3 rounded-md text-sm border",
                    lastSync.status === 'completed' 
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-100"
                      : lastSync.status === 'failed'
                            ? "bg-red-500/10 border-red-500/40 text-red-100"
                            : "bg-white/5 border-white/10 text-gray-200"
                  )}>
                    {lastSync.message}
                  </div>
                )}

                {/* Timestamps */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs text-gray-300">
                  {lastSync.started_at && (
                    <div>
                            <p className="font-medium mb-1 text-gray-200">Started</p>
                      <p>{new Date(lastSync.started_at).toLocaleString()}</p>
                    </div>
                  )}
                  {lastSync.completed_at && (
                    <div>
                            <p className="font-medium mb-1 text-gray-200">Completed</p>
                      <p>{new Date(lastSync.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchSyncStatus({ showLoading: true })}
                          className="border-white/20 text-gray-100 hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/integrations-hub')}
                          className="border-white/20 text-gray-100 hover:bg-white/10"
                  >
                    Go to Integrations
                  </Button>
                  {lastSync.status === 'completed' && (
                    <Button 
                      onClick={() => navigate('/app')}
                      className="bg-white text-[#172B4D] hover:bg-white/90 font-semibold border border-white/30"
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
    </PageLayout>
  );
}

