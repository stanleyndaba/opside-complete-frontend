import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSyncHistory } from '@/lib/inventoryApi';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface SyncHistoryItem {
  syncId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string | null;
  ordersProcessed?: number;
  totalOrders?: number;
  inventoryCount?: number;      // ⭐ NEW
  shipmentsCount?: number;       // ⭐ NEW
  returnsCount?: number;         // ⭐ NEW
  settlementsCount?: number;     // ⭐ NEW
  feesCount?: number;            // ⭐ NEW
  claimsDetected?: number;
  duration?: number;
  error?: string | null;
}

export function SyncHistory() {
  const [syncs, setSyncs] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await getSyncHistory();
        // Handle documented response format: {success: true, history: [...], total: N}
        // Also handle legacy format: {syncs: [...]}
        if (data?.history && Array.isArray(data.history)) {
          setSyncs(data.history);
        } else if (data?.syncs && Array.isArray(data.syncs)) {
          // Legacy format support
          setSyncs(data.syncs);
        } else {
          setSyncs([]);
        }
        setError(null);
      } catch (e: any) {
        console.error('Failed to fetch sync history:', e);
        setError(e?.message || 'Failed to load sync history');
        setSyncs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'complete': // Support legacy status value
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'running':
      case 'in_progress': // Support legacy status value
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'complete': // Support legacy status value
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Failed</Badge>;
      case 'running':
      case 'in_progress': // Support legacy status value
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Running</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Idle</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-gray-100">Sync History</CardTitle>
          <CardDescription className="text-gray-400">Loading sync history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-gray-100">Sync History</CardTitle>
          <CardDescription className="text-gray-400">Error loading sync history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-400">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (syncs.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-gray-100">Sync History</CardTitle>
          <CardDescription className="text-gray-400">No sync history available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400 text-center py-8">
            No syncs have been performed yet. Start a sync to see history here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
      <CardHeader>
        <CardTitle className="text-gray-100">Sync History</CardTitle>
        <CardDescription className="text-gray-400">
          View past sync jobs and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {syncs.map((sync) => (
            <div
              key={sync.syncId}
              className="border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getStatusIcon(sync.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-gray-100 font-mono">{sync.syncId.slice(0, 8)}...</span>
                      {getStatusBadge(sync.status)}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>
                        Started: <span className="text-gray-300">{formatDistanceToNow(new Date(sync.startedAt), { addSuffix: true })}</span>
                      </div>
                      {sync.completedAt && (
                        <div>
                          Completed: <span className="text-gray-300">{formatDistanceToNow(new Date(sync.completedAt), { addSuffix: true })}</span>
                        </div>
                      )}
                      {sync.duration !== undefined && (
                        <div>Duration: <span className="text-gray-300">{formatDuration(sync.duration)}</span></div>
                      )}
                      
                      {/* Calculate total items synced */}
                      {(() => {
                        const ordersProcessed = sync.ordersProcessed || 0;
                        const inventoryCount = sync.inventoryCount || 0;
                        const shipmentsCount = sync.shipmentsCount || 0;
                        const returnsCount = sync.returnsCount || 0;
                        const settlementsCount = sync.settlementsCount || 0;
                        const feesCount = sync.feesCount || 0;
                        const totalItemsSynced = 
                          ordersProcessed +
                          inventoryCount +
                          shipmentsCount +
                          returnsCount +
                          settlementsCount +
                          feesCount;
                        
                        return (
                          <>
                            {totalItemsSynced > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <div className="text-blue-400 font-medium mb-1">
                                  Total: {totalItemsSynced.toLocaleString()} items synced
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {sync.ordersProcessed !== undefined && sync.totalOrders !== undefined && (
                                    <div>Orders: <span className="text-gray-300">{sync.ordersProcessed.toLocaleString()} / {sync.totalOrders.toLocaleString()}</span></div>
                                  )}
                                  {inventoryCount > 0 && (
                                    <div>Inventory: <span className="text-gray-300">{inventoryCount.toLocaleString()}</span></div>
                                  )}
                                  {shipmentsCount > 0 && (
                                    <div>Shipments: <span className="text-gray-300">{shipmentsCount.toLocaleString()}</span></div>
                                  )}
                                  {returnsCount > 0 && (
                                    <div>Returns: <span className="text-gray-300">{returnsCount.toLocaleString()}</span></div>
                                  )}
                                  {settlementsCount > 0 && (
                                    <div>Settlements: <span className="text-gray-300">{settlementsCount.toLocaleString()}</span></div>
                                  )}
                                  {feesCount > 0 && (
                                    <div>Fees: <span className="text-gray-300">{feesCount.toLocaleString()}</span></div>
                                  )}
                                </div>
                              </div>
                            )}
                            {/* Fallback to old format if new fields not available */}
                            {totalItemsSynced === 0 && sync.ordersProcessed !== undefined && (
                              <div>Orders processed: <span className="text-gray-300">{sync.ordersProcessed.toLocaleString()}</span></div>
                            )}
                          </>
                        );
                      })()}
                      
                      {sync.claimsDetected !== undefined && sync.claimsDetected > 0 && (
                        <div className="text-emerald-400 font-medium mt-1">
                          Claims detected: {sync.claimsDetected.toLocaleString()}
                        </div>
                      )}
                      {sync.error && (
                        <div className="text-red-400 mt-2">
                          Error: {sync.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

