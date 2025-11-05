import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSyncHistory } from '@/lib/inventoryApi';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface SyncHistoryItem {
  syncId: string;
  status: 'idle' | 'in_progress' | 'complete' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  ordersProcessed?: number;
  claimsDetected?: number;
  duration?: number;
  error?: string;
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
        if (data?.syncs && Array.isArray(data.syncs)) {
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
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Complete</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-400 text-gray-400">Idle</Badge>;
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
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Loading sync history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Error loading sync history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (syncs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>No sync history available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No syncs have been performed yet. Start a sync to see history here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync History</CardTitle>
        <CardDescription>
          View past sync jobs and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {syncs.map((sync) => (
            <div
              key={sync.syncId}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getStatusIcon(sync.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{sync.syncId}</span>
                      {getStatusBadge(sync.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Started: {formatDistanceToNow(new Date(sync.startedAt), { addSuffix: true })}
                      </div>
                      {sync.completedAt && (
                        <div>
                          Completed: {formatDistanceToNow(new Date(sync.completedAt), { addSuffix: true })}
                        </div>
                      )}
                      {sync.duration !== undefined && (
                        <div>Duration: {formatDuration(sync.duration)}</div>
                      )}
                      {sync.ordersProcessed !== undefined && (
                        <div>Orders processed: {sync.ordersProcessed.toLocaleString()}</div>
                      )}
                      {sync.claimsDetected !== undefined && (
                        <div className="text-emerald-600 font-medium">
                          Claims detected: {sync.claimsDetected.toLocaleString()}
                        </div>
                      )}
                      {sync.error && (
                        <div className="text-red-500 mt-2">
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

