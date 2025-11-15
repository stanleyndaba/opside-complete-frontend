import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
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
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch sync status
  const fetchSyncStatus = async (useMock = false) => {
    try {
      if (useMock) {
        // Use mock data
        setIsUsingMockData(true);
        setSyncStatus(MOCK_SYNC_STATUS as SyncStatusData);
        setIsLoading(false);
        return;
      }

      const response = await api.getSyncStatus();
      
      if (response.ok && response.data) {
        setIsUsingMockData(false);
        // Map API response to our interface (handle both camelCase and snake_case)
        const data = response.data as any;
        const mappedData: SyncStatusData = {
          hasActiveSync: data.hasActiveSync || false,
          lastSync: data.lastSync ? {
            id: data.lastSync.syncId || data.lastSync.id || '',
            status: data.lastSync.status || 'idle',
            started_at: data.lastSync.startedAt || data.lastSync.started_at || '',
            completed_at: data.lastSync.completedAt || data.lastSync.completed_at || null,
            progress: data.lastSync.progress || 0,
            message: data.lastSync.message,
            ordersProcessed: data.lastSync.ordersProcessed,
            totalOrders: data.lastSync.totalOrders,
            inventoryCount: data.lastSync.inventoryCount,      // ⭐ NEW
            shipmentsCount: data.lastSync.shipmentsCount,       // ⭐ NEW
            returnsCount: data.lastSync.returnsCount,           // ⭐ NEW
            settlementsCount: data.lastSync.settlementsCount,   // ⭐ NEW
            feesCount: data.lastSync.feesCount,                // ⭐ NEW
            claimsDetected: data.lastSync.claimsDetected
          } : null
        };
        setSyncStatus(mappedData);
        setIsLoading(false);
      } else {
        // Backend unavailable, use mock data
        console.warn('[SyncStatus] Backend unavailable, using mock data');
        setIsUsingMockData(true);
        setSyncStatus(MOCK_SYNC_STATUS as SyncStatusData);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[SyncStatus] Failed to get sync status:', error);
      // Use mock data on error
      setIsUsingMockData(true);
      setSyncStatus(MOCK_SYNC_STATUS as SyncStatusData);
      setIsLoading(false);
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
        await fetchSyncStatus(isUsingMockData);
      }, 3000); // Poll every 3 seconds
      
      setPollingInterval(interval);
    };

    // Initial fetch
    fetchSyncStatus().then(() => {
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
    
    // Stop polling when sync is done
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else if ((status === 'running' || status === 'in_progress') && !pollingInterval) {
      // Restart polling if sync becomes active again
      const interval = setInterval(async () => {
        await fetchSyncStatus(isUsingMockData);
      }, 3000);
      setPollingInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus?.lastSync?.status, isUsingMockData, pollingInterval]);

  const getStatusIcon = () => {
    if (!syncStatus?.lastSync) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    
    switch (syncStatus.lastSync.status) {
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
    
    switch (syncStatus.lastSync.status) {
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
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-muted-foreground">Loading sync status...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Sync Status">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mock Data Indicator */}
        {isUsingMockData && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">🔧 Using mock data</span>
                <span className="text-xs text-amber-500">(Backend unavailable - remove in production)</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Amazon Sync Status
            </CardTitle>
            <CardDescription>
              Current synchronization status for your Amazon account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!lastSync ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sync History</h3>
                  <p className="text-muted-foreground mb-4">
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
                    <p className="text-sm font-medium">Status</p>
                    {getStatusBadge()}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">Last Synced</p>
                    <p className="text-sm text-muted-foreground">
                      {lastSync.completed_at 
                        ? `${getMinutesAgo(lastSync.completed_at)} minutes ago`
                        : lastSync.started_at
                        ? `Started ${getMinutesAgo(lastSync.started_at)} minutes ago`
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar (if running) */}
                {(lastSync.status === 'running' || lastSync.status === 'in_progress') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{lastSync.progress}%</span>
                    </div>
                    <Progress value={lastSync.progress} className="h-2" />
                    {lastSync.message && (
                      <p className="text-xs text-muted-foreground">{lastSync.message}</p>
                    )}
                  </div>
                )}

                {/* Sync Details - Calculate total items synced */}
                {(() => {
                  const ordersProcessed = lastSync.ordersProcessed || 0;
                  const totalOrders = lastSync.totalOrders || 0;
                  const inventoryCount = lastSync.inventoryCount || 0;
                  const shipmentsCount = lastSync.shipmentsCount || 0;
                  const returnsCount = lastSync.returnsCount || 0;
                  const settlementsCount = lastSync.settlementsCount || 0;
                  const feesCount = lastSync.feesCount || 0;
                  const claimsDetected = lastSync.claimsDetected || 0;
                  
                  // Calculate total items synced (sum of all data types)
                  const totalItemsSynced = 
                    ordersProcessed +
                    inventoryCount +
                    shipmentsCount +
                    returnsCount +
                    settlementsCount +
                    feesCount;
                  
                  return (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Total Items Synced */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Items Synced</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalItemsSynced.toLocaleString()} items
                        </p>
                        {lastSync.message && lastSync.message.includes('items synced') && (
                          <p className="text-xs text-muted-foreground mt-1">{lastSync.message}</p>
                        )}
                      </div>
                      
                      {/* Data Type Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ordersProcessed > 0 && totalOrders > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Orders</p>
                            <p className="text-lg font-semibold">
                              {ordersProcessed.toLocaleString()} / {totalOrders.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {inventoryCount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Inventory</p>
                            <p className="text-lg font-semibold">
                              {inventoryCount.toLocaleString()} items
                            </p>
                          </div>
                        )}
                        {shipmentsCount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Shipments</p>
                            <p className="text-lg font-semibold">
                              {shipmentsCount.toLocaleString()} items
                            </p>
                          </div>
                        )}
                        {returnsCount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Returns</p>
                            <p className="text-lg font-semibold">
                              {returnsCount.toLocaleString()} items
                            </p>
                          </div>
                        )}
                        {settlementsCount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Settlements</p>
                            <p className="text-lg font-semibold">
                              {settlementsCount.toLocaleString()} items
                            </p>
                          </div>
                        )}
                        {feesCount > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fees</p>
                            <p className="text-lg font-semibold">
                              {feesCount.toLocaleString()} items
                            </p>
                          </div>
                        )}
                        {claimsDetected > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Claims Detected</p>
                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                              {claimsDetected.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Message */}
                {lastSync.message && lastSync.status !== 'running' && lastSync.status !== 'in_progress' && (
                  <div className={cn(
                    "p-3 rounded-md text-sm",
                    lastSync.status === 'completed' 
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                      : lastSync.status === 'failed'
                      ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                      : "bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400"
                  )}>
                    {lastSync.message}
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
                  {lastSync.started_at && (
                    <div>
                      <p className="font-medium mb-1">Started</p>
                      <p>{new Date(lastSync.started_at).toLocaleString()}</p>
                    </div>
                  )}
                  {lastSync.completed_at && (
                    <div>
                      <p className="font-medium mb-1">Completed</p>
                      <p>{new Date(lastSync.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchSyncStatus(isUsingMockData)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/integrations-hub')}
                  >
                    Go to Integrations
                  </Button>
                  {lastSync.status === 'completed' && (
                    <Button onClick={() => navigate('/app')}>
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

