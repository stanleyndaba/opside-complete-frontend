import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Truck, Warehouse, ShoppingCart, RotateCcw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useStatusStream } from '@/hooks/use-status-stream';
import { SyncHistory } from '@/components/SyncHistory';
import { cn } from '@/lib/utils';

export default function SmartInventorySync() {
  const [syncStatus, setSyncStatus] = useState<{ healthy: boolean; lastReconciliation?: string; skusMonitored?: number; discrepanciesFound?: number; dataPointsAnalyzed?: number }>({ healthy: true });
  const [activityLog, setActivityLog] = useState<Array<{ timestamp: string; message: string; type: 'success' | 'warning' | 'info' }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [statusRes, activityRes] = await Promise.all([
        api.getSyncStatus(),
        api.getSyncActivity(),
      ]);
      if (!cancelled) {
        if (statusRes.ok && statusRes.data) {
          // Map generic to UI fields if needed
          setSyncStatus({
            healthy: (statusRes.data as any).status !== 'failed',
            lastReconciliation: (statusRes.data as any).lastReconciliation,
            skusMonitored: (statusRes.data as any).skusMonitored,
            discrepanciesFound: (statusRes.data as any).discrepanciesFound,
            dataPointsAnalyzed: (statusRes.data as any).dataPointsAnalyzed,
          });
          setError(null);
        } else {
          setError(statusRes.error || 'Failed to load sync status');
        }
        if (activityRes.ok && Array.isArray(activityRes.data)) {
          setActivityLog(activityRes.data as any);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Real-time sync updates
  useStatusStream((evt) => {
    if (evt.type === 'sync') {
      setSyncStatus(prev => ({ ...prev, healthy: evt.status !== 'failed' }));
    }
  });

  const dataSources = [
    {
      name: 'Shipment Data',
      icon: Truck,
      status: 'Connected & Syncing',
      lastPulled: '2 minutes ago',
      description: 'Tracks all inventory sent to Amazon fulfillment centers.',
      isHealthy: true
    },
    {
      name: 'Fulfillment Center Data',
      icon: Warehouse,
      status: 'Connected & Syncing',
      lastPulled: '5 minutes ago',
      description: 'Monitors inventory received, transferred, and held at FBA warehouses.',
      isHealthy: true
    },
    {
      name: 'Sales & Order Data',
      icon: ShoppingCart,
      status: 'Connected & Syncing',
      lastPulled: '1 minute ago',
      description: 'Reconciles units sold against physical inventory removals.',
      isHealthy: true
    },
    {
      name: 'Returns Data',
      icon: RotateCcw,
      status: 'Connected & Syncing',
      lastPulled: '3 minutes ago',
      description: 'Tracks all customer returns to ensure they are correctly processed back into your inventory.',
      isHealthy: true
    }
  ];

  

  return (
    <PageLayout title="Smart Inventory Sync" midnight forceTransparent>
      <div className="space-y-8 min-h-screen" style={{
        fontFamily: "var(--font-inter),-apple-system,Helvetica,Arial,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\""
      }}>
        {/* Overall Status Indicator */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {syncStatus.healthy ? (
                <div className="flex-shrink-0">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-10 w-10 text-amber-400" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-100 mb-1">
                  {syncStatus.healthy ? 'All Systems Synced & Reconciled' : 'Action Required: Data source needs attention'}
                </h2>
                <p className="text-gray-300 text-sm">
                  Your inventory data is being continuously monitored and reconciled
                </p>
                {loading && (
                  <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400/60 rounded-full animate-pulse" style={{ width: '50%' }} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total SKUs Monitored</p>
                <p className="text-3xl font-semibold text-gray-100">{(syncStatus.skusMonitored || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-300">Unique products tracked</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Full Reconciliation</p>
                <p className="text-3xl font-semibold text-gray-100">{(syncStatus.lastReconciliation || '').split(' - ')[1] || '—'}</p>
                <p className="text-sm text-gray-300">{(syncStatus.lastReconciliation || '').split(' - ')[0] || 'Never'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Discrepancies Found</p>
                <p className="text-3xl font-semibold text-gray-100">{(syncStatus.discrepanciesFound || 0).toString()}</p>
                <p className="text-sm text-gray-300">Last 30 days</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Data Points Analyzed</p>
                <p className="text-3xl font-semibold text-gray-100">{(syncStatus.dataPointsAnalyzed || 0).toLocaleString()}</p>
                <p className="text-sm text-gray-300">And growing...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Source Conduits */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-gray-100">Data Source Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataSources.map((source, index) => {
              const IconComponent = source.icon;
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:bg-white/15 hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.15)] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                          <IconComponent className="h-5 w-5 text-blue-400" />
                        </div>
                        <CardTitle className="text-lg text-gray-100">{source.name}</CardTitle>
                      </div>
                      <Badge className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
                        source.isHealthy 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          source.isHealthy ? "bg-emerald-400" : "bg-amber-400"
                        )}></div>
                        {source.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3 text-gray-300">
                      {source.description}
                    </CardDescription>
                    <p className="text-sm text-gray-400">
                      Last Pulled: <span className="text-gray-300">{source.lastPulled}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Reconciliation Activity Log */}
        <div>
          <h3 className="text-xl font-semibold mb-6 text-gray-100">Reconciliation Activity Log</h3>
          <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {activityLog.length > 0 ? (
                  activityLog.map((entry, index) => (
                    <div key={index} className="p-4 flex items-start space-x-3 hover:bg-white/5 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          entry.type === 'success' ? 'bg-emerald-400' : 
                          entry.type === 'warning' ? 'bg-amber-400' : 
                          'bg-blue-400'
                        )}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-100">{entry.message}</p>
                          <time className="text-xs text-gray-400 ml-4">{entry.timestamp}</time>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-sm text-gray-400 text-center">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span>Loading activity log...</span>
                      </div>
                    ) : (
                      'No activity log entries yet'
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 rounded-2xl shadow-[0_8px_32px_0_rgba(220,38,38,0.1)]">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Error Loading Sync Status</h4>
                  <p className="text-sm text-gray-300">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync History */}
        <div>
          <SyncHistory />
        </div>
      </div>
    </PageLayout>
  );
}