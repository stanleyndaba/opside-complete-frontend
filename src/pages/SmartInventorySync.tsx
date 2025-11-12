import React, { useEffect, useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, AlertTriangle, Truck, Warehouse, ShoppingCart, RotateCcw, 
  Loader2, RefreshCw, Search, Download, Calendar, Package, DollarSign,
  XCircle, Clock, ArrowUpDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { useStatusStream } from '@/hooks/use-status-stream';
import { SyncHistory } from '@/components/SyncHistory';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// TypeScript interfaces based on PHASE2_FRONTEND_GUIDE.md
interface OrderItem {
  sku: string;
  asin: string;
  quantity: number;
  price: number;
  title?: string;
}

interface Order {
  id: string;
  order_id: string;
  seller_id?: string;
  marketplace_id: string;
  order_date: string;
  shipment_date?: string;
  fulfillment_channel: string;
  order_status: string;
  items: OrderItem[];
  quantities: Record<string, number>;
  total_amount?: number;
  currency: string;
  metadata: {
    orderType?: string;
    salesChannel?: string;
    isPrime?: boolean;
    isBusinessOrder?: boolean;
    numberOfItemsShipped?: number;
    numberOfItemsUnshipped?: number;
  };
  sync_timestamp: string;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface ShipmentItem {
  sku: string;
  asin: string;
  quantity: number;
}

interface Shipment {
  id: string;
  shipment_id: string;
  order_id?: string;
  tracking_number?: string;
  shipped_date?: string;
  received_date?: string;
  status: string;
  carrier?: string;
  warehouse_location?: string;
  items: ShipmentItem[];
  expected_quantity: number;
  received_quantity?: number;
  missing_quantity: number;
  metadata: {
    shipmentType?: string;
    fulfillmentCenterId?: string;
  };
  sync_timestamp: string;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface ReturnItem {
  sku: string;
  asin: string;
  quantity: number;
  refund_amount: number;
}

interface Return {
  id: string;
  return_id: string;
  order_id?: string;
  reason: string;
  returned_date: string;
  status: string;
  refund_amount: number;
  currency: string;
  items: ReturnItem[];
  is_partial: boolean;
  metadata: {
    returnType?: string;
    disposition?: string;
  };
  sync_timestamp: string;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface Settlement {
  id: string;
  settlement_id: string;
  order_id?: string;
  transaction_type: string;
  amount: number;
  fees: number;
  currency: string;
  settlement_date: string;
  fee_breakdown: {
    fba_fee?: number;
    referral_fee?: number;
    shipping_fee?: number;
    storage_fee?: number;
    long_term_storage_fee?: number;
    removal_fee?: number;
    [key: string]: number | undefined;
  };
  metadata: Record<string, any>;
  sync_timestamp: string;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  syncId?: string;
  progress?: number;
  lastSync?: string;
  results?: {
    orders?: { count: number; status: string };
    shipments?: { count: number; status: string };
    returns?: { count: number; status: string };
    settlements?: { count: number; status: string };
  };
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

type DataTab = 'orders' | 'shipments' | 'returns' | 'settlements';

export default function SmartInventorySync() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DataTab>('orders');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Pagination
  const [ordersPagination, setOrdersPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false });
  const [shipmentsPagination, setShipmentsPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false });
  const [returnsPagination, setReturnsPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false });
  const [settlementsPagination, setSettlementsPagination] = useState({ limit: 50, offset: 0, total: 0, hasMore: false });

  // Filters
  const [ordersFilters, setOrdersFilters] = useState({ status: '', fulfillmentChannel: '', search: '' });
  const [shipmentsFilters, setShipmentsFilters] = useState({ status: '', search: '' });
  const [returnsFilters, setReturnsFilters] = useState({ status: '', search: '' });
  const [settlementsFilters, setSettlementsFilters] = useState({ transactionType: '', search: '' });

  // Date filters
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Get user ID
  useEffect(() => {
    (async () => {
      const res = await api.getMe();
      if (res.ok && res.data) {
        setUserId(res.data.id || res.data.user_id);
      }
    })();
  }, []);

  // Load sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const res = await api.getSyncStatusDetailed({ userId: userId || undefined });
        if (res.ok && res.data) {
          setSyncStatus(res.data);
        }
      } catch (e) {
        console.error('Failed to load sync status:', e);
      }
    };

    if (userId) {
      loadSyncStatus();
      // Poll sync status every 5 seconds if running
      const interval = setInterval(() => {
        if (syncStatus.status === 'running') {
          loadSyncStatus();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [userId, syncStatus.status]);

  // Load data based on active tab
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        switch (activeTab) {
          case 'orders':
            const ordersRes = await api.getOrders({
              userId,
              status: ordersFilters.status || undefined,
              fulfillmentChannel: ordersFilters.fulfillmentChannel as 'FBA' | 'FBM' | undefined,
              startDate: dateRange.startDate || undefined,
              endDate: dateRange.endDate || undefined,
              limit: ordersPagination.limit,
              offset: ordersPagination.offset,
            });
            if (ordersRes.ok && ordersRes.data) {
              const data = ordersRes.data.data || ordersRes.data;
              setOrders(Array.isArray(data) ? data : []);
              if (ordersRes.data.pagination) {
                setOrdersPagination(prev => ({
                  ...prev,
                  total: ordersRes.data.pagination.total || 0,
                  hasMore: ordersRes.data.pagination.hasMore || false,
                }));
              }
            }
            break;
          case 'shipments':
            const shipmentsRes = await api.getShipments({
              userId,
              status: shipmentsFilters.status || undefined,
              startDate: dateRange.startDate || undefined,
              endDate: dateRange.endDate || undefined,
              limit: shipmentsPagination.limit,
              offset: shipmentsPagination.offset,
            });
            if (shipmentsRes.ok && shipmentsRes.data) {
              const data = shipmentsRes.data.data || shipmentsRes.data;
              setShipments(Array.isArray(data) ? data : []);
              if (shipmentsRes.data.pagination) {
                setShipmentsPagination(prev => ({
                  ...prev,
                  total: shipmentsRes.data.pagination.total || 0,
                  hasMore: shipmentsRes.data.pagination.hasMore || false,
                }));
              }
            }
            break;
          case 'returns':
            const returnsRes = await api.getReturns({
              userId,
              status: returnsFilters.status || undefined,
              startDate: dateRange.startDate || undefined,
              endDate: dateRange.endDate || undefined,
              limit: returnsPagination.limit,
              offset: returnsPagination.offset,
            });
            if (returnsRes.ok && returnsRes.data) {
              const data = returnsRes.data.data || returnsRes.data;
              setReturns(Array.isArray(data) ? data : []);
              if (returnsRes.data.pagination) {
                setReturnsPagination(prev => ({
                  ...prev,
                  total: returnsRes.data.pagination.total || 0,
                  hasMore: returnsRes.data.pagination.hasMore || false,
                }));
              }
            }
            break;
          case 'settlements':
            const settlementsRes = await api.getSettlements({
              userId,
              transactionType: settlementsFilters.transactionType || undefined,
              startDate: dateRange.startDate || undefined,
              endDate: dateRange.endDate || undefined,
              limit: settlementsPagination.limit,
              offset: settlementsPagination.offset,
            });
            if (settlementsRes.ok && settlementsRes.data) {
              const data = settlementsRes.data.data || settlementsRes.data;
              setSettlements(Array.isArray(data) ? data : []);
              if (settlementsRes.data.pagination) {
                setSettlementsPagination(prev => ({
                  ...prev,
                  total: settlementsRes.data.pagination.total || 0,
                  hasMore: settlementsRes.data.pagination.hasMore || false,
                }));
              }
            }
            break;
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
        toast({ title: 'Error', description: e?.message || 'Failed to load data' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, userId, ordersFilters, shipmentsFilters, returnsFilters, settlementsFilters, dateRange, ordersPagination.offset, shipmentsPagination.offset, returnsPagination.offset, settlementsPagination.offset]);

  // Trigger manual sync
  const handleSync = async () => {
    if (!userId) {
      toast({ title: 'Error', description: 'User ID not found' });
      return;
    }

    setSyncing(true);
    try {
      const res = await api.triggerSync({ userId });
      if (res.ok && res.data) {
        toast({ title: 'Sync Started', description: res.data.message || 'Sync initiated successfully' });
        setSyncStatus({ status: 'running', syncId: res.data.syncId, progress: 0 });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to start sync' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to start sync' });
    } finally {
      setSyncing(false);
    }
  };

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Format date time helper
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  // Format currency helper
  const formatCurrency = (amount?: number, currency: string = 'USD'): string => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('delivered') || statusLower.includes('received') || statusLower.includes('refunded')) {
      return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">{status}</Badge>;
    } else if (statusLower.includes('pending') || statusLower.includes('in_transit') || statusLower.includes('processing')) {
      return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">{status}</Badge>;
    } else if (statusLower.includes('failed') || statusLower.includes('cancelled') || statusLower.includes('rejected') || statusLower.includes('lost') || statusLower.includes('damaged')) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">{status}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Summary stats
  const ordersSummary = useMemo(() => {
    return {
      total: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      byStatus: orders.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [orders]);

  const shipmentsSummary = useMemo(() => {
    return {
      total: shipments.length,
      missingItems: shipments.filter(s => s.missing_quantity > 0).length,
      byStatus: shipments.reduce((acc, shipment) => {
        acc[shipment.status] = (acc[shipment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [shipments]);

  const returnsSummary = useMemo(() => {
    return {
      total: returns.length,
      totalRefunded: returns.reduce((sum, ret) => sum + ret.refund_amount, 0),
      partial: returns.filter(r => r.is_partial).length,
      byStatus: returns.reduce((acc, ret) => {
        acc[ret.status] = (acc[ret.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [returns]);

  const settlementsSummary = useMemo(() => {
    return {
      total: settlements.length,
      totalFees: settlements.reduce((sum, s) => sum + s.fees, 0),
      totalAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
      byType: settlements.reduce((acc, s) => {
        acc[s.transaction_type] = (acc[s.transaction_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [settlements]);

  return (
    <PageLayout title="Smart Inventory Sync" midnight forceTransparent>
      <div className="space-y-6 min-h-screen">
        {/* Sync Status Indicator */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {syncStatus.status === 'completed' ? (
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                ) : syncStatus.status === 'running' ? (
                  <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
                ) : syncStatus.status === 'failed' ? (
                  <XCircle className="h-10 w-10 text-red-400" />
                ) : (
                  <Clock className="h-10 w-10 text-gray-400" />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-100 mb-1">
                    {syncStatus.status === 'completed' && 'Last synced successfully'}
                    {syncStatus.status === 'running' && `Syncing... ${syncStatus.progress || 0}%`}
                    {syncStatus.status === 'failed' && 'Sync failed'}
                    {syncStatus.status === 'idle' && (syncStatus.lastSync ? `Last synced ${formatDateTime(syncStatus.lastSync)}` : 'No sync yet')}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {syncStatus.status === 'running' && 'Data synchronization in progress'}
                    {syncStatus.status === 'completed' && 'All data is up to date'}
                    {syncStatus.status === 'failed' && 'Please try syncing again'}
                    {syncStatus.status === 'idle' && 'Click "Sync Now" to fetch latest data'}
                  </p>
                  {syncStatus.status === 'running' && syncStatus.progress !== undefined && (
                    <Progress value={syncStatus.progress} className="mt-2" />
                  )}
                  {syncStatus.results && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      {syncStatus.results.orders && (
                        <span>Orders: {syncStatus.results.orders.count}</span>
                      )}
                      {syncStatus.results.shipments && (
                        <span>Shipments: {syncStatus.results.shipments.count}</span>
                      )}
                      {syncStatus.results.returns && (
                        <span>Returns: {syncStatus.results.returns.count}</span>
                      )}
                      {syncStatus.results.settlements && (
                        <span>Settlements: {syncStatus.results.settlements.count}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleSync} 
                disabled={syncing || syncStatus.status === 'running'}
                className="bg-emerald-500 hover:bg-emerald-400 text-white"
              >
                {syncing || syncStatus.status === 'running' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Error</h4>
                  <p className="text-sm text-gray-300">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Data Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataTab)} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-xl border-white/10 rounded-lg p-1">
            <TabsTrigger value="orders" className="data-[state=active]:bg-white/20">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
              {ordersSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{ordersSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shipments" className="data-[state=active]:bg-white/20">
              <Truck className="h-4 w-4 mr-2" />
              Shipments
              {shipmentsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{shipmentsSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="returns" className="data-[state=active]:bg-white/20">
              <RotateCcw className="h-4 w-4 mr-2" />
              Returns
              {returnsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{returnsSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settlements" className="data-[state=active]:bg-white/20">
              <DollarSign className="h-4 w-4 mr-2" />
              Settlements
              {settlementsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{settlementsSummary.total}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-100">{ordersSummary.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-100">{formatCurrency(ordersSummary.totalAmount)}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Statuses</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(ordersSummary.byStatus).map(([status, count]) => (
                      <Badge key={status} variant="secondary">{status}: {count}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Search by Order ID..."
                    value={ordersFilters.search}
                    onChange={(e) => setOrdersFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                  <Select value={ordersFilters.status} onValueChange={(v) => setOrdersFilters(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ordersFilters.fulfillmentChannel} onValueChange={(v) => setOrdersFilters(prev => ({ ...prev, fulfillmentChannel: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Channels</SelectItem>
                      <SelectItem value="FBA">FBA</SelectItem>
                      <SelectItem value="FBM">FBM</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/5 border-white/10"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Your Amazon order data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No orders found. {!userId && 'Please connect your Amazon account.'}
                    {userId && 'Click "Sync Now" to fetch your orders.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Currency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter(order => {
                            if (ordersFilters.search && !order.order_id.toLowerCase().includes(ordersFilters.search.toLowerCase())) {
                              return false;
                            }
                            return true;
                          })
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                              <TableCell>{formatDate(order.order_date)}</TableCell>
                              <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{order.fulfillment_channel}</Badge>
                              </TableCell>
                              <TableCell>{order.items.length} item(s)</TableCell>
                              <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                              <TableCell>{order.currency}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Shipments</p>
                  <p className="text-2xl font-semibold text-gray-100">{shipmentsSummary.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Missing Items</p>
                  <p className="text-2xl font-semibold text-red-400">{shipmentsSummary.missingItems}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Statuses</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(shipmentsSummary.byStatus).map(([status, count]) => (
                      <Badge key={status} variant="secondary">{status}: {count}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Search by Shipment ID..."
                    value={shipmentsFilters.search}
                    onChange={(e) => setShipmentsFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                  <Select value={shipmentsFilters.status} onValueChange={(v) => setShipmentsFilters(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/5 border-white/10"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipments Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Shipments</CardTitle>
                <CardDescription>FBA shipment tracking data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading shipments...</span>
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No shipments found. Click "Sync Now" to fetch your shipments.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shipment ID</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expected</TableHead>
                          <TableHead>Received</TableHead>
                          <TableHead>Missing</TableHead>
                          <TableHead>Shipped Date</TableHead>
                          <TableHead>Received Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipments
                          .filter(shipment => {
                            if (shipmentsFilters.search && !shipment.shipment_id.toLowerCase().includes(shipmentsFilters.search.toLowerCase())) {
                              return false;
                            }
                            return true;
                          })
                          .map((shipment) => (
                            <TableRow key={shipment.id}>
                              <TableCell className="font-mono text-sm">{shipment.shipment_id}</TableCell>
                              <TableCell className="font-mono text-sm">{shipment.order_id || '—'}</TableCell>
                              <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                              <TableCell>{shipment.expected_quantity}</TableCell>
                              <TableCell>{shipment.received_quantity ?? '—'}</TableCell>
                              <TableCell>
                                {shipment.missing_quantity > 0 ? (
                                  <span className="text-red-400 font-semibold">{shipment.missing_quantity}</span>
                                ) : (
                                  <span className="text-green-400">0</span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(shipment.shipped_date)}</TableCell>
                              <TableCell>{formatDate(shipment.received_date)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Returns</p>
                  <p className="text-2xl font-semibold text-gray-100">{returnsSummary.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Refunded</p>
                  <p className="text-2xl font-semibold text-gray-100">{formatCurrency(returnsSummary.totalRefunded)}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Partial Returns</p>
                  <p className="text-2xl font-semibold text-gray-100">{returnsSummary.partial}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Search by Return ID..."
                    value={returnsFilters.search}
                    onChange={(e) => setReturnsFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                  <Select value={returnsFilters.status} onValueChange={(v) => setReturnsFilters(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/5 border-white/10"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Returns Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Returns</CardTitle>
                <CardDescription>Customer return data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading returns...</span>
                  </div>
                ) : returns.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No returns found. Click "Sync Now" to fetch your returns.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Return ID</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Refund Amount</TableHead>
                          <TableHead>Partial</TableHead>
                          <TableHead>Returned Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returns
                          .filter(ret => {
                            if (returnsFilters.search && !ret.return_id.toLowerCase().includes(returnsFilters.search.toLowerCase())) {
                              return false;
                            }
                            return true;
                          })
                          .map((ret) => (
                            <TableRow key={ret.id}>
                              <TableCell className="font-mono text-sm">{ret.return_id}</TableCell>
                              <TableCell className="font-mono text-sm">{ret.order_id || '—'}</TableCell>
                              <TableCell>{ret.reason}</TableCell>
                              <TableCell>{getStatusBadge(ret.status)}</TableCell>
                              <TableCell>{formatCurrency(ret.refund_amount, ret.currency)}</TableCell>
                              <TableCell>
                                {ret.is_partial ? (
                                  <Badge variant="secondary">Partial</Badge>
                                ) : (
                                  <Badge variant="outline">Full</Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(ret.returned_date)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Settlements</p>
                  <p className="text-2xl font-semibold text-gray-100">{settlementsSummary.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Fees</p>
                  <p className="text-2xl font-semibold text-red-400">{formatCurrency(settlementsSummary.totalFees)}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-xl border-white/10">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 uppercase">Total Amount</p>
                  <p className="text-2xl font-semibold text-gray-100">{formatCurrency(settlementsSummary.totalAmount)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Search by Settlement ID..."
                    value={settlementsFilters.search}
                    onChange={(e) => setSettlementsFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="bg-white/5 border-white/10"
                  />
                  <Select value={settlementsFilters.transactionType} onValueChange={(v) => setSettlementsFilters(prev => ({ ...prev, transactionType: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="reimbursement">Reimbursement</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/5 border-white/10"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settlements Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Settlements</CardTitle>
                <CardDescription>Financial settlements and fee data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading settlements...</span>
                  </div>
                ) : settlements.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No settlements found. Click "Sync Now" to fetch your settlements.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Settlement ID</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Fees</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Settlement Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlements
                          .filter(settlement => {
                            if (settlementsFilters.search && !settlement.settlement_id.toLowerCase().includes(settlementsFilters.search.toLowerCase())) {
                              return false;
                            }
                            return true;
                          })
                          .map((settlement) => (
                            <TableRow key={settlement.id}>
                              <TableCell className="font-mono text-sm">{settlement.settlement_id}</TableCell>
                              <TableCell className="font-mono text-sm">{settlement.order_id || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{settlement.transaction_type}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(settlement.amount, settlement.currency)}</TableCell>
                              <TableCell>{formatCurrency(settlement.fees, settlement.currency)}</TableCell>
                              <TableCell>{settlement.currency}</TableCell>
                              <TableCell>{formatDate(settlement.settlement_date)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sync History */}
        <div>
          <SyncHistory />
        </div>
      </div>
    </PageLayout>
  );
}
