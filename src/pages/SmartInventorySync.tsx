import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { CheckCircle, AlertTriangle, Truck, Warehouse, ShoppingCart, RotateCcw } from 'lucide-react';
import { subscribeRealtime, type RealtimeEvent } from '@/lib/realtime';
import { toast } from 'sonner';

export default function SmartInventorySync() {
  const [syncStatus, setSyncStatus] = useState({
    healthy: true,
    lastReconciliation: '—',
    skusMonitored: 0,
    discrepanciesFound: 0,
    dataPointsAnalyzed: 0
  });
  useEffect(() => {
    const unsub = subscribeRealtime((evt: RealtimeEvent) => {
      if (evt.type === 'sync') {
        if (evt.status === 'completed') {
          toast.success('Sync completed');
        } else if (evt.status === 'failed') {
          toast.error('Sync failed');
        }
      }
    });
    return () => unsub();
  }, []);

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

  const activityLog = [
    {
      timestamp: 'August 9, 12:05 AM',
      message: 'Successfully completed full reconciliation. 3 new discrepancies detected and sent to Value Engine.',
      type: 'success'
    },
    {
      timestamp: 'August 9, 12:01 AM',
      message: 'Successfully synced FBA Returns Report.',
      type: 'success'
    },
    {
      timestamp: 'August 9, 12:00 AM',
      message: 'Initiated scheduled daily data reconciliation.',
      type: 'info'
    },
    {
      timestamp: 'August 8, 11:58 PM',
      message: 'Successfully synced Sales & Order Data.',
      type: 'success'
    },
    {
      timestamp: 'August 8, 11:55 PM',
      message: 'Successfully synced Fulfillment Center Data.',
      type: 'success'
    }
  ];

  return (
    <PageLayout title="Smart Inventory Sync">
      <div className="space-y-8">
        {/* Overall Status Indicator */}
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              {syncStatus.healthy ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-warning" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {syncStatus.healthy ? 'All Systems Synced & Reconciled' : 'Action Required: Data source needs attention'}
                </h2>
                <p className="text-muted-foreground">
                  Your inventory data is being continuously monitored and reconciled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total SKUs Monitored"
            value={syncStatus.skusMonitored.toLocaleString()}
            description="Unique products tracked"
          />
          <StatsCard
            title="Last Full Reconciliation"
            value="12:05 AM"
            description="August 9, 2025"
          />
          <StatsCard
            title="Discrepancies Found"
            value={syncStatus.discrepanciesFound}
            description="Last 30 days"
          />
          <StatsCard
            title="Data Points Analyzed"
            value={syncStatus.dataPointsAnalyzed.toLocaleString()}
            description="And growing..."
          />
        </div>

        {/* Data Source Conduits */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Data Source Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataSources.map((source, index) => {
              const IconComponent = source.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                      </div>
                      <Badge variant={source.isHealthy ? "default" : "destructive"} className="bg-success/10 text-success border-success/20">
                        <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                        {source.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-2">
                      {source.description}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">
                      Last Pulled: {source.lastPulled}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Reconciliation Activity Log */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Reconciliation Activity Log</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activityLog.map((entry, index) => (
                  <div key={index} className="p-4 flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        entry.type === 'success' ? 'bg-success' : 
                        entry.type === 'warning' ? 'bg-warning' : 
                        'bg-primary'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground">{entry.message}</p>
                        <time className="text-xs text-muted-foreground">{entry.timestamp}</time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}