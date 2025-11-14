import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle, AlertTriangle, Truck, Warehouse, ShoppingCart, RotateCcw, 
  Loader2, RefreshCw, Search, Download, Calendar, Package, DollarSign,
  XCircle, Clock, ArrowUpDown, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
// import { useStatusStream } from '@/hooks/use-status-stream'; // Not used currently
import { SyncHistory } from '@/components/SyncHistory';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { MockDataIndicator } from '@/components/MockDataIndicator';
import { ConnectionStatusBadge } from '@/components/ConnectionStatusBadge';

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

type DataTab = 'claims' | 'inventory' | 'orders' | 'shipments' | 'returns' | 'settlements';

export default function SmartInventorySync() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DataTab>('claims');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidencePrompt, setShowEvidencePrompt] = useState<boolean>(false);
  const [amazonConnected, setAmazonConnected] = useState(false);
  const syncCompletedRef = useRef<string | null>(null); // Track which syncId we've already handled
  const currentSyncIdRef = useRef<string | undefined>(undefined); // Track current syncId for polling

  // Data state
  const [claims, setClaims] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  
  // Phase 1: Mock data indicators
  const [claimsIsMock, setClaimsIsMock] = useState(false);
  const [claimsMockScenario, setClaimsMockScenario] = useState<string | null>(null);
  const [inventoryIsMock, setInventoryIsMock] = useState(false);
  const [inventoryMockScenario, setInventoryMockScenario] = useState<string | null>(null);

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

  // Get user ID and check Amazon connection status
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMe();
        if (res.ok && res.data) {
          setUserId(res.data.id || res.data.user_id || res.data.userId);
        } else {
          // Even if API fails, show the page (it will show empty state)
          console.warn('Failed to get user ID, but continuing to show page');
          setLoading(false);
        }
      } catch (e) {
        console.error('Error getting user ID:', e);
        // Continue to show page even if user ID fetch fails
        setLoading(false);
      }

      // Check Amazon connection status
      try {
        const statusRes = await api.getAmazonConnectionStatus();
        if (statusRes.ok && statusRes.data) {
          setAmazonConnected(statusRes.data.connected || false);
        }
      } catch (e) {
        console.error('Error checking Amazon connection:', e);
      }
      
      // Load claims immediately on mount (default tab is 'claims')
      // This ensures claims are loaded even if the tab hasn't changed
      try {
        console.log('[Initial Load] Fetching claims on page mount...');
        const claimsRes = await api.getAmazonClaims();
        console.log('[Initial Load] Claims response:', {
          ok: claimsRes.ok,
          status: claimsRes.status,
          hasData: !!claimsRes.data
        });
        
        if (claimsRes.ok && claimsRes.data) {
          // Check if backend returned success: true
          if (claimsRes.data.success !== false) {
            // Handle both response formats: { data: [...] } or direct array
            let claimsData: any[] = [];
            if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
              claimsData = claimsRes.data.data;
            } else if (Array.isArray(claimsRes.data)) {
              claimsData = claimsRes.data;
            }
            
            console.log('[Initial Load] Loaded claims:', claimsData.length);
            setClaims(claimsData);
            setClaimsIsMock(claimsRes.data.isMock || false);
            setClaimsMockScenario(claimsRes.data.mockScenario || null);
          } else {
            console.warn('[Initial Load] Backend returned success: false:', {
              message: claimsRes.data.message,
              data: claimsRes.data
            });
            setClaims([]);
            setClaimsIsMock(false);
            setClaimsMockScenario(null);
          }
        }
      } catch (e) {
        console.error('[Initial Load] Error loading claims:', e);
      }
    })();
  }, []);

  // Show evidence prompt 4 seconds after landing on the page
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user has dismissed the prompt before
      try {
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('clario.evidencePromptDismissed') === 'true' : false;
        if (!dismissed) {
          // Check if any evidence sources are connected
          (async () => {
            try {
              const s = await api.getIntegrationsStatus();
              if (s.ok) {
                const prov = (s.data as any)?.providerIngest || {};
                const anyConnected = Boolean(prov.gmail?.connected || prov.outlook?.connected || prov.gdrive?.connected || prov.dropbox?.connected);
                if (!anyConnected) {
                  setShowEvidencePrompt(true);
                }
              } else {
                // If status unknown, still prompt once
                setShowEvidencePrompt(true);
              }
            } catch {
              setShowEvidencePrompt(true);
            }
          })();
        }
      } catch {
        // If localStorage check fails, still show prompt
        setShowEvidencePrompt(true);
      }
    }, 4000); // 4 seconds delay

    return () => clearTimeout(timer);
  }, []);

  // Load sync status and poll if running
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        // Use syncId from ref if available for more accurate status polling
        // Using ref avoids dependency issues in useEffect
        // Don't poll with 'unknown' syncId - wait for a real syncId
        const syncIdParam = currentSyncIdRef.current && currentSyncIdRef.current !== 'unknown'
          ? { syncId: currentSyncIdRef.current } 
          : undefined;
        
        // Try the general sync status endpoint first (doesn't require userId)
        // Pass syncId if we have one for more accurate polling
        const res = await api.getSyncStatus(syncIdParam);
        if (res.ok && res.data) {
          const statusData = res.data;
          
          // Check if we have a syncId from a previous 409 response but status shows no active sync
          // This might mean the sync completed but status endpoint doesn't show it
          if (currentSyncIdRef.current && currentSyncIdRef.current !== 'unknown' && 
              !statusData.hasActiveSync && !statusData.lastSync) {
            // Try to get detailed status for this specific syncId
            // Note: This endpoint may not be implemented (404), so we handle it gracefully
            console.log('[Sync Status] No active sync in general status, checking detailed status for:', currentSyncIdRef.current);
            try {
              const detailedRes = await api.getSyncStatusDetailed({ syncId: currentSyncIdRef.current });
              if (detailedRes.ok && detailedRes.data) {
                const detailed = detailedRes.data;
                // Map backend status values to frontend status
                // Backend may return "in_progress" or "running"
                const mappedStatus = detailed.status === 'completed' ? 'completed' : 
                                     (detailed.status === 'in_progress' || detailed.status === 'running') ? 'running' : 
                                     detailed.status === 'failed' ? 'failed' : 'idle';
                
                setSyncStatus({
                  status: mappedStatus,
                  syncId: detailed.syncId,
                  progress: detailed.progress || 0,
                  lastSync: detailed.completedAt || detailed.startedAt,
                });
                
                // If sync completed, refresh claims
                if (detailed.status === 'completed' && detailed.syncId && syncCompletedRef.current !== detailed.syncId) {
                  syncCompletedRef.current = detailed.syncId;
                  console.log('[Sync Status] Sync completed (from detailed status), refreshing claims...');
                  // Refresh claims after sync completion
                  try {
                    const claimsRes = await api.getAmazonClaims();
                    if (claimsRes.ok && claimsRes.data) {
                      let claimsData: any[] = [];
                      if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
                        claimsData = claimsRes.data.data;
                      } else if (Array.isArray(claimsRes.data)) {
                        claimsData = claimsRes.data;
                      }
                      setClaims(claimsData);
                      setClaimsIsMock(claimsRes.data.isMock || false);
                      setClaimsMockScenario(claimsRes.data.mockScenario || null);
                      console.log('[Sync Status] Refreshed claims after sync completion:', claimsData.length);
                    }
                  } catch (e) {
                    console.error('[Sync Status] Error refreshing claims:', e);
                  }
                }
                return; // Don't process general status if we got detailed status
              } else if (detailedRes.status === 404) {
                // Endpoint not implemented - this is fine, just continue with general status
                console.log('[Sync Status] Detailed status endpoint not available (404), trying to refresh data in case sync completed...');
                // Since we have a syncId but no active sync and detailed endpoint doesn't exist,
                // the sync might have completed. Try refreshing data once.
                if (syncCompletedRef.current !== currentSyncIdRef.current) {
                  try {
                    const [claimsRes, inventoryRes] = await Promise.all([
                      api.getAmazonClaims(),
                      api.getAmazonInventory()
                    ]);
                    
                    // If we get data, assume sync completed
                    let hasData = false;
                    if (claimsRes.ok && claimsRes.data && claimsRes.data.success !== false) {
                      let claimsData: any[] = [];
                      if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
                        claimsData = claimsRes.data.data;
                      } else if (Array.isArray(claimsRes.data)) {
                        claimsData = claimsRes.data;
                      }
                      if (claimsData.length > 0) {
                        hasData = true;
                        setClaims(claimsData);
                        setClaimsIsMock(claimsRes.data.isMock || false);
                        setClaimsMockScenario(claimsRes.data.mockScenario || null);
                        console.log('[Sync Status] Found', claimsData.length, 'claims - sync likely completed');
                      }
                    }
                    
                    if (inventoryRes.ok && inventoryRes.data && inventoryRes.data.success !== false && 'data' in inventoryRes.data) {
                      const inventoryData = inventoryRes.data.data || [];
                      if (inventoryData.length > 0) {
                        hasData = true;
                        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                        setInventoryIsMock(inventoryRes.data.isMock || false);
                        setInventoryMockScenario(inventoryRes.data.mockScenario || null);
                        console.log('[Sync Status] Found', inventoryData.length, 'inventory items - sync likely completed');
                      }
                    }
                    
                    // If we found data, mark sync as completed
                    if (hasData && currentSyncIdRef.current) {
                      syncCompletedRef.current = currentSyncIdRef.current;
                      setSyncStatus({ 
                        status: 'completed', 
                        syncId: currentSyncIdRef.current,
                        progress: 100
                      });
                      toast({
                        title: '✅ Sync Completed',
                        description: 'Your Amazon data has been synced successfully.',
                        duration: 3000,
                      });
                    }
                  } catch (e) {
                    console.error('[Sync Status] Error checking for data:', e);
                  }
                }
              }
            } catch (e) {
              // Silently handle errors - detailed status endpoint may not be implemented
              console.log('[Sync Status] Detailed status check failed (endpoint may not be implemented):', e instanceof Error ? e.message : 'Unknown error');
            }
          }
          
          if (statusData.hasActiveSync && statusData.lastSync) {
            const lastSync = statusData.lastSync;
            // Map backend status values to frontend status
            // Backend may return "in_progress" which maps to "running"
            const mappedStatus = lastSync.status === 'completed' ? 'completed' : 
                                 lastSync.status === 'in_progress' || lastSync.status === 'running' ? 'running' : 
                                 lastSync.status === 'failed' ? 'failed' : 'idle';
            
            const syncId = lastSync.syncId;
            if (syncId) {
              currentSyncIdRef.current = syncId; // Update ref when we get syncId from status
            }
            
            setSyncStatus({
              status: mappedStatus,
              syncId: syncId,
              progress: lastSync.progress || 0,
              lastSync: lastSync.completedAt || lastSync.startedAt,
            });
            
            // If sync just completed, refresh data for the active tab (only once per syncId)
            if (lastSync.status === 'completed' && lastSync.syncId && syncCompletedRef.current !== lastSync.syncId) {
              syncCompletedRef.current = lastSync.syncId;
              
              // Show completion toast
              toast({
                title: '✅ Sync Completed',
                description: 'Your Amazon data has been synced successfully. Refreshing data...',
                duration: 3000,
              });
              
              // Always refresh claims and inventory after sync completes (regardless of active tab)
              // This ensures data is available when user switches tabs
              try {
                // Fetch claims
                try {
                  console.log('[Sync] Fetching claims after sync completion...');
                  const claimsRes = await api.getAmazonClaims();
                  console.log('[Sync] Claims API response:', {
                    ok: claimsRes.ok,
                    status: claimsRes.status,
                    error: claimsRes.error,
                    hasData: !!claimsRes.data,
                    dataKeys: claimsRes.data ? Object.keys(claimsRes.data) : []
                  });
                  
                  if (claimsRes.ok && claimsRes.data) {
                    // Check if backend returned success: true
                    if (claimsRes.data.success !== false) {
                      // Handle both response formats: { data: [...] } or direct array
                      let claimsData: any[] = [];
                      if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
                        claimsData = claimsRes.data.data;
                      } else if (Array.isArray(claimsRes.data)) {
                        claimsData = claimsRes.data;
                      }
                      
                      console.log('[Sync] Refreshed claims data:', {
                        count: claimsData.length,
                        isMock: claimsRes.data.isMock || false,
                        mockScenario: claimsRes.data.mockScenario || null
                      });
                      
                      setClaims(claimsData);
                      setClaimsIsMock(claimsRes.data.isMock || false);
                      setClaimsMockScenario(claimsRes.data.mockScenario || null);
                    } else {
                      console.warn('[Sync] Backend returned success: false:', {
                        message: claimsRes.data.message,
                        data: claimsRes.data
                      });
                    }
                  } else {
                    console.error('[Sync] Failed to fetch claims:', {
                      ok: claimsRes.ok,
                      status: claimsRes.status,
                      error: claimsRes.error,
                      data: claimsRes.data
                    });
                  }
                } catch (e) {
                  console.error('[Sync] Exception fetching claims after sync:', e);
                }
                
                // Fetch inventory
                try {
                  const inventoryRes = await api.getAmazonInventory();
                  if (inventoryRes.ok && inventoryRes.data) {
                    // Check if backend returned success: true
                    if (inventoryRes.data.success !== false && 'data' in inventoryRes.data) {
                      const inventoryData = inventoryRes.data.data || [];
                      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                      setInventoryIsMock(inventoryRes.data.isMock || false);
                      setInventoryMockScenario(inventoryRes.data.mockScenario || null);
                      console.log('[Sync] Refreshed inventory data:', inventoryData.length, 'items');
                    } else {
                      console.warn('[Sync] Backend returned success: false for inventory:', {
                        message: inventoryRes.data.message,
                        data: inventoryRes.data
                      });
                    }
                  } else {
                    console.error('[Sync] Failed to fetch inventory:', inventoryRes.error || 'Unknown error');
                  }
                } catch (e) {
                  console.error('Failed to fetch inventory after sync:', e);
                }
              } catch (e) {
                console.error('Failed to refresh data after sync:', e);
              }
            }
          } else {
            setSyncStatus({ status: 'idle' });
          }
        } else {
          // Fallback to detailed status if available (but handle 404 gracefully)
          if (userId) {
            try {
              const detailedRes = await api.getSyncStatusDetailed({ userId });
              if (detailedRes.ok && detailedRes.data) {
                const detailed = detailedRes.data;
                // Map backend status to frontend SyncStatus type
                const mappedStatus = detailed.status === 'completed' ? 'completed' : 
                                     (detailed.status === 'in_progress' || detailed.status === 'running') ? 'running' : 
                                     detailed.status === 'failed' ? 'failed' : 'idle';
                
                setSyncStatus({
                  status: mappedStatus,
                  syncId: detailed.syncId,
                  progress: detailed.progress || 0,
                  lastSync: detailed.completedAt || detailed.startedAt,
                  results: detailed.results,
                  startedAt: detailed.startedAt,
                  completedAt: detailed.completedAt,
                  duration: detailed.duration,
                });
              } else if (detailedRes.status === 404) {
                // Endpoint not implemented - just set idle status
                console.log('[Sync Status] Detailed status endpoint not available (404)');
                setSyncStatus({ status: 'idle' });
              } else {
          setSyncStatus({ status: 'idle' });
              }
            } catch (e) {
              // Silently handle errors - detailed status endpoint may not be implemented
              setSyncStatus({ status: 'idle' });
            }
          } else {
            setSyncStatus({ status: 'idle' });
          }
        }
      } catch (e) {
        console.error('Failed to load sync status:', e);
        setSyncStatus({ status: 'idle' });
      }
    };

    loadSyncStatus();
    
    // Poll sync status every 5 seconds if running
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userId, activeTab]);

  // Use useMemo to memoize filter values to prevent unnecessary re-renders
  const memoizedOrdersFilters = useMemo(() => ordersFilters, [ordersFilters.status, ordersFilters.fulfillmentChannel, ordersFilters.search]);
  const memoizedShipmentsFilters = useMemo(() => shipmentsFilters, [shipmentsFilters.status, shipmentsFilters.search]);
  const memoizedReturnsFilters = useMemo(() => returnsFilters, [returnsFilters.status, returnsFilters.search]);
  const memoizedSettlementsFilters = useMemo(() => settlementsFilters, [settlementsFilters.transactionType, settlementsFilters.search]);
  const memoizedDateRange = useMemo(() => dateRange, [dateRange.startDate, dateRange.endDate]);

  // Load data based on active tab - only when tab or userId changes initially
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (cancelled) return;
      
      setLoading(true);
      setError(null);
      
      try {
        switch (activeTab) {
          case 'claims':
            // Claims endpoint doesn't require userId - uses session auth
            console.log('[Claims] Fetching claims data...');
            const claimsRes = await api.getAmazonClaims({
              startDate: memoizedDateRange.startDate || undefined,
              endDate: memoizedDateRange.endDate || undefined,
            });
            console.log('[Claims] API response:', {
              ok: claimsRes.ok,
              status: claimsRes.status,
              error: claimsRes.error,
              hasData: !!claimsRes.data,
              dataKeys: claimsRes.data ? Object.keys(claimsRes.data) : [],
              dataStructure: claimsRes.data
            });
            
            if (!cancelled && claimsRes.ok && claimsRes.data) {
              // Check if backend returned success: true
              if (claimsRes.data.success !== false) {
                // Handle both response formats: { data: [...] } or direct array
                let claimsData: any[] = [];
                if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
                  claimsData = claimsRes.data.data;
                } else if (Array.isArray(claimsRes.data)) {
                  claimsData = claimsRes.data;
                }
                
                console.log('[Claims] Parsed claims data:', {
                  count: claimsData.length,
                  isMock: claimsRes.data.isMock || false,
                  mockScenario: claimsRes.data.mockScenario || null,
                  sampleClaim: claimsData[0] || null
                });
                
                setClaims(claimsData);
                setClaimsIsMock(claimsRes.data.isMock || false);
                setClaimsMockScenario(claimsRes.data.mockScenario || null);
              } else {
                // Backend returned success: false
                console.warn('[Claims] Backend returned success: false:', {
                  message: claimsRes.data.message,
                  data: claimsRes.data
                });
                setClaims([]);
                setClaimsIsMock(false);
                setClaimsMockScenario(null);
              }
            } else if (!cancelled) {
              console.warn('[Claims] Failed to fetch claims:', {
                ok: claimsRes.ok,
                status: claimsRes.status,
                error: claimsRes.error,
                data: claimsRes.data
              });
              setClaims([]);
              setClaimsIsMock(false);
              setClaimsMockScenario(null);
            }
            break;
          case 'inventory':
            // Inventory endpoint doesn't require userId - uses session auth
            const inventoryRes = await api.getAmazonInventory();
            if (!cancelled && inventoryRes.ok && inventoryRes.data) {
              // Check if backend returned success: true
              if (inventoryRes.data.success !== false) {
                const inventoryData = inventoryRes.data.data || [];
                setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                setInventoryIsMock(inventoryRes.data.isMock || false);
                setInventoryMockScenario(inventoryRes.data.mockScenario || null);
              } else {
                console.warn('[Inventory] Backend returned success: false:', {
                  message: inventoryRes.data.message,
                  data: inventoryRes.data
                });
                setInventory([]);
                setInventoryIsMock(false);
                setInventoryMockScenario(null);
              }
            } else if (!cancelled) {
              setInventory([]);
              setInventoryIsMock(false);
              setInventoryMockScenario(null);
            }
            break;
          case 'orders':
            if (!userId) {
              // Orders endpoint requires userId
              if (!cancelled) {
                setOrders([]);
                setLoading(false);
              }
              break;
            }
            const ordersRes = await api.getOrders({
              userId,
              status: memoizedOrdersFilters.status || undefined,
              fulfillmentChannel: memoizedOrdersFilters.fulfillmentChannel as 'FBA' | 'FBM' | undefined,
              startDate: memoizedDateRange.startDate || undefined,
              endDate: memoizedDateRange.endDate || undefined,
              limit: ordersPagination.limit,
              offset: ordersPagination.offset,
            });
            if (!cancelled && ordersRes.ok && ordersRes.data) {
              const data = ordersRes.data.data || ordersRes.data;
              const ordersArray = Array.isArray(data) ? data : [];
              // Client-side search filter
              const filteredOrders = memoizedOrdersFilters.search 
                ? ordersArray.filter((order: Order) => 
                    order?.order_id?.toLowerCase().includes(memoizedOrdersFilters.search.toLowerCase())
                  )
                : ordersArray;
              setOrders(filteredOrders);
              if (ordersRes.data.pagination) {
                setOrdersPagination(prev => ({
                  ...prev,
                  total: ordersRes.data.pagination.total || 0,
                  hasMore: ordersRes.data.pagination.hasMore || false,
                }));
              }
            } else if (!cancelled) {
              setOrders([]);
            }
            break;
          case 'shipments':
            const shipmentsRes = await api.getShipments({
              userId,
              status: memoizedShipmentsFilters.status || undefined,
              startDate: memoizedDateRange.startDate || undefined,
              endDate: memoizedDateRange.endDate || undefined,
              limit: shipmentsPagination.limit,
              offset: shipmentsPagination.offset,
            });
            if (!cancelled && shipmentsRes.ok && shipmentsRes.data) {
              const data = shipmentsRes.data.data || shipmentsRes.data;
              const shipmentsArray = Array.isArray(data) ? data : [];
              const filteredShipments = memoizedShipmentsFilters.search
                ? shipmentsArray.filter((shipment: Shipment) =>
                    shipment?.shipment_id?.toLowerCase().includes(memoizedShipmentsFilters.search.toLowerCase())
                  )
                : shipmentsArray;
              setShipments(filteredShipments);
              if (shipmentsRes.data.pagination) {
                setShipmentsPagination(prev => ({
                  ...prev,
                  total: shipmentsRes.data.pagination.total || 0,
                  hasMore: shipmentsRes.data.pagination.hasMore || false,
                }));
              }
            } else if (!cancelled) {
              setShipments([]);
            }
            break;
          case 'returns':
            const returnsRes = await api.getReturns({
              userId,
              status: memoizedReturnsFilters.status || undefined,
              startDate: memoizedDateRange.startDate || undefined,
              endDate: memoizedDateRange.endDate || undefined,
              limit: returnsPagination.limit,
              offset: returnsPagination.offset,
            });
            if (!cancelled && returnsRes.ok && returnsRes.data) {
              const data = returnsRes.data.data || returnsRes.data;
              const returnsArray = Array.isArray(data) ? data : [];
              const filteredReturns = memoizedReturnsFilters.search
                ? returnsArray.filter((ret: Return) =>
                    ret?.return_id?.toLowerCase().includes(memoizedReturnsFilters.search.toLowerCase())
                  )
                : returnsArray;
              setReturns(filteredReturns);
              if (returnsRes.data.pagination) {
                setReturnsPagination(prev => ({
                  ...prev,
                  total: returnsRes.data.pagination.total || 0,
                  hasMore: returnsRes.data.pagination.hasMore || false,
                }));
              }
            } else if (!cancelled) {
              setReturns([]);
            }
            break;
          case 'settlements':
            const settlementsRes = await api.getSettlements({
              userId,
              transactionType: memoizedSettlementsFilters.transactionType || undefined,
              startDate: memoizedDateRange.startDate || undefined,
              endDate: memoizedDateRange.endDate || undefined,
              limit: settlementsPagination.limit,
              offset: settlementsPagination.offset,
            });
            if (!cancelled && settlementsRes.ok && settlementsRes.data) {
              const data = settlementsRes.data.data || settlementsRes.data;
              const settlementsArray = Array.isArray(data) ? data : [];
              const filteredSettlements = memoizedSettlementsFilters.search
                ? settlementsArray.filter((settlement: Settlement) =>
                    settlement?.settlement_id?.toLowerCase().includes(memoizedSettlementsFilters.search.toLowerCase())
                  )
                : settlementsArray;
              setSettlements(filteredSettlements);
              if (settlementsRes.data.pagination) {
                setSettlementsPagination(prev => ({
                  ...prev,
                  total: settlementsRes.data.pagination.total || 0,
                  hasMore: settlementsRes.data.pagination.hasMore || false,
                }));
              }
            } else if (!cancelled) {
              setSettlements([]);
            }
            break;
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('Error loading data:', e);
          setError(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Load data immediately on tab/userId change, debounced for filter changes
    const timeoutId = setTimeout(loadData, activeTab !== 'orders' && orders.length === 0 ? 0 : 100);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeTab, userId, memoizedOrdersFilters, memoizedShipmentsFilters, memoizedReturnsFilters, memoizedSettlementsFilters, memoizedDateRange, ordersPagination.offset, shipmentsPagination.offset, returnsPagination.offset, settlementsPagination.offset]);

  // Trigger manual sync
  const handleSync = async () => {
    // Check if Amazon is connected first
    if (!amazonConnected) {
      toast({ 
        title: 'Not Connected', 
        description: 'Please connect your Amazon account first to sync data.',
        variant: 'destructive'
      });
      return;
    }

    setSyncing(true);
    try {
      // Use the Phase 1 sync endpoint: POST /api/v1/integrations/amazon/sync
      // According to Phase 1 requirements, this should work with empty body (uses session auth)
      const res = await api.triggerSync();
      if (res.ok && res.data) {
        const syncId = res.data.syncId;
        toast({ 
          title: 'Sync Started', 
          description: res.data.message || 'Sync initiated successfully' 
        });
        // Backend returns status: "in_progress", map to 'running' for internal state
        const backendStatus = res.data.status;
        const actualSyncId = syncId || 'unknown';
        currentSyncIdRef.current = actualSyncId; // Update ref for polling
        setSyncStatus({ 
          status: backendStatus === 'in_progress' || backendStatus === 'running' ? 'running' : 
                  backendStatus === 'completed' ? 'completed' : 
                  backendStatus === 'failed' ? 'failed' : 'running',
          syncId: actualSyncId, 
          progress: 0 
        });
        // Refresh connection status after sync starts
        const statusRes = await api.getAmazonConnectionStatus();
        if (statusRes.ok && statusRes.data) {
          setAmazonConnected(statusRes.data.connected || false);
        }
        
        // Start polling for sync completion
        // The useEffect will handle polling and data refresh
      } else {
        // Backend returned an error - show detailed error message
        const errorData = res.data as any; // Error responses may have different shape
        const errorMsg = res.error || errorData?.message || 'Failed to start sync';
        const errorCode = errorData?.error;
        console.error('[Sync] Error response:', {
          status: res.status,
          error: res.error,
          errorCode: errorCode,
          data: errorData,
          fullResponse: res
        });
        
        // Handle 409 Conflict - Sync already in progress
        if (res.status === 409 || errorCode === 'sync_in_progress') {
          // Try to get existingSyncId from response data (now included in error responses)
          const existingSyncId = res.data?.existingSyncId || errorData?.existingSyncId || 'unknown';
          console.log('[Sync] 409 Conflict - Existing sync found:', {
            existingSyncId: existingSyncId,
            responseData: res.data,
            errorData: errorData
          });
          
          if (existingSyncId && existingSyncId !== 'unknown') {
            currentSyncIdRef.current = existingSyncId; // Update ref for polling
            setSyncStatus({ 
              status: 'running', 
              syncId: existingSyncId, 
              progress: 0 
            });
            toast({ 
              title: 'Sync Already Running', 
              description: `Sync is already in progress (${existingSyncId}). Checking status and refreshing data...`,
              duration: 5000
            });
            
            // Immediately try to refresh data in case the sync already completed
            // The sync might have finished very quickly
            try {
              console.log('[Sync] 409 received - immediately refreshing data in case sync completed...');
              const [claimsRes, inventoryRes] = await Promise.all([
                api.getAmazonClaims(),
                api.getAmazonInventory()
              ]);
              
              // Refresh claims if available
              if (claimsRes.ok && claimsRes.data && claimsRes.data.success !== false) {
                let claimsData: any[] = [];
                if ('data' in claimsRes.data && Array.isArray(claimsRes.data.data)) {
                  claimsData = claimsRes.data.data;
                } else if (Array.isArray(claimsRes.data)) {
                  claimsData = claimsRes.data;
                }
                if (claimsData.length > 0) {
                  console.log('[Sync] Found', claimsData.length, 'claims after 409 - sync may have completed');
                  setClaims(claimsData);
                  setClaimsIsMock(claimsRes.data.isMock || false);
                  setClaimsMockScenario(claimsRes.data.mockScenario || null);
                }
              }
              
              // Refresh inventory if available
              if (inventoryRes.ok && inventoryRes.data && inventoryRes.data.success !== false && 'data' in inventoryRes.data) {
                const inventoryData = inventoryRes.data.data || [];
                if (inventoryData.length > 0) {
                  console.log('[Sync] Found', inventoryData.length, 'inventory items after 409 - sync may have completed');
                  setInventory(Array.isArray(inventoryData) ? inventoryData : []);
                  setInventoryIsMock(inventoryRes.data.isMock || false);
                  setInventoryMockScenario(inventoryRes.data.mockScenario || null);
                }
              }
            } catch (e) {
              console.error('[Sync] Error refreshing data after 409:', e);
            }
          } else {
            // If we can't get the syncId, still show the message but don't set status
            toast({ 
              title: 'Sync Already Running', 
              description: errorMsg || 'A sync is already in progress. Please wait for it to complete.',
              duration: 5000
            });
          }
          return; // Don't show error toast, just inform user
        }
        
        // Provide more helpful error message based on status code
        let userMessage = errorMsg;
        let title = 'Sync Failed';
        
        if (res.status === 500 || errorCode === 'internal_server_error') {
          userMessage = 'Backend server error. The sync endpoint may not be fully implemented yet. Please check backend logs.';
        } else if (res.status === 401 || errorCode === 'unauthorized') {
          title = 'Authentication Required';
          userMessage = 'Please log in to sync your Amazon data.';
        } else if (res.status === 400 || errorCode === 'amazon_not_connected') {
          title = 'Amazon Not Connected';
          userMessage = errorMsg || 'Amazon account not connected. Please connect your Amazon account first.';
        }
        
        toast({ 
          title: title, 
          description: userMessage,
          variant: 'destructive',
          duration: 6000
        });
      }
    } catch (e: any) {
      console.error('[Sync] Exception:', e);
      toast({ 
        title: 'Sync Failed', 
        description: e?.message || 'Failed to start sync. Please try again.',
        variant: 'destructive'
      });
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

  // Summary stats - with safe defaults
  const ordersSummary = useMemo(() => {
    try {
      return {
        total: Array.isArray(orders) ? orders.length : 0,
        totalAmount: Array.isArray(orders) ? orders.reduce((sum, order) => sum + (order?.total_amount || 0), 0) : 0,
        byStatus: Array.isArray(orders) ? orders.reduce((acc, order) => {
          const status = order?.order_status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) : {},
      };
    } catch (e) {
      return { total: 0, totalAmount: 0, byStatus: {} };
    }
  }, [orders]);

  const shipmentsSummary = useMemo(() => {
    try {
      return {
        total: Array.isArray(shipments) ? shipments.length : 0,
        missingItems: Array.isArray(shipments) ? shipments.filter(s => (s?.missing_quantity || 0) > 0).length : 0,
        byStatus: Array.isArray(shipments) ? shipments.reduce((acc, shipment) => {
          const status = shipment?.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) : {},
      };
    } catch (e) {
      return { total: 0, missingItems: 0, byStatus: {} };
    }
  }, [shipments]);

  const returnsSummary = useMemo(() => {
    try {
      return {
        total: Array.isArray(returns) ? returns.length : 0,
        totalRefunded: Array.isArray(returns) ? returns.reduce((sum, ret) => sum + (ret?.refund_amount || 0), 0) : 0,
        partial: Array.isArray(returns) ? returns.filter(r => r?.is_partial).length : 0,
        byStatus: Array.isArray(returns) ? returns.reduce((acc, ret) => {
          const status = ret?.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) : {},
      };
    } catch (e) {
      return { total: 0, totalRefunded: 0, partial: 0, byStatus: {} };
    }
  }, [returns]);

  const settlementsSummary = useMemo(() => {
    try {
      return {
        total: Array.isArray(settlements) ? settlements.length : 0,
        totalFees: Array.isArray(settlements) ? settlements.reduce((sum, s) => sum + (s?.fees || 0), 0) : 0,
        totalAmount: Array.isArray(settlements) ? settlements.reduce((sum, s) => sum + (s?.amount || 0), 0) : 0,
        byType: Array.isArray(settlements) ? settlements.reduce((acc, s) => {
          const type = s?.transaction_type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) : {},
      };
    } catch (e) {
      return { total: 0, totalFees: 0, totalAmount: 0, byType: {} };
    }
  }, [settlements]);

  // Render sync status text safely
  const getSyncStatusText = () => {
    if (syncStatus.status === 'completed') return 'Last synced successfully';
    if (syncStatus.status === 'running') return `Syncing... ${syncStatus.progress || 0}%`;
    if (syncStatus.status === 'failed') return 'Sync failed';
    if (syncStatus.lastSync) return `Last synced ${formatDateTime(syncStatus.lastSync)}`;
    return 'No sync yet';
  };

  const getSyncStatusDescription = () => {
    if (syncStatus.status === 'running') return 'Data synchronization in progress';
    if (syncStatus.status === 'completed') return 'All data is up to date';
    if (syncStatus.status === 'failed') return 'Please try syncing again';
    return 'Click "Sync Now" to fetch latest data';
  };

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
                    {getSyncStatusText()}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {getSyncStatusDescription()}
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
                disabled={syncing || syncStatus.status === 'running' || !amazonConnected}
                className="bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-400 mb-1">Error Loading Data</h4>
                  <p className="text-sm text-gray-300">{error}</p>
                  <p className="text-xs text-gray-400 mt-2">The page will continue to work, but data may not be available.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Data Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataTab)} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-xl border-white/10 rounded-lg p-1">
            <TabsTrigger 
              value="claims" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Claims
              {claims.length > 0 && (
                <Badge variant="secondary" className="ml-2">{claims.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <Warehouse className="h-4 w-4 mr-2" />
              Inventory
              {inventory.length > 0 && (
                <Badge variant="secondary" className="ml-2">{inventory.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
              {ordersSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{ordersSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="shipments" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <Truck className="h-4 w-4 mr-2" />
              Shipments
              {shipmentsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{shipmentsSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="returns" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Returns
              {returnsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{returnsSummary.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="settlements" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-emerald-500 text-white hover:text-emerald-500 transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Settlements
              {settlementsSummary.total > 0 && (
                <Badge variant="secondary" className="ml-2">{settlementsSummary.total}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Claims & Reimbursements</CardTitle>
                    <CardDescription>Financial events and reimbursement claims</CardDescription>
                  </div>
                  <MockDataIndicator isMock={claimsIsMock} scenario={claimsMockScenario || undefined} />
                </div>
              </CardHeader>
              <CardContent>
                {loading && claims.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading claims...</span>
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">No claims found.</p>
                    <p className="text-sm">Click "Sync Now" to fetch your claims from Amazon.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.map((claim) => (
                          <TableRow key={claim.id}>
                            <TableCell className="font-mono text-sm">{claim.id}</TableCell>
                            <TableCell className="font-mono text-sm">{claim.orderId || '—'}</TableCell>
                            <TableCell>{formatCurrency(claim.amount, claim.currency)}</TableCell>
                            <TableCell>{getStatusBadge(claim.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{claim.type}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(claim.createdAt)}</TableCell>
                            <TableCell className="text-sm text-gray-300">{claim.description || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Inventory</CardTitle>
                    <CardDescription>Current inventory levels and stock information</CardDescription>
                  </div>
                  <MockDataIndicator isMock={inventoryIsMock} scenario={inventoryMockScenario || undefined} />
                </div>
              </CardHeader>
              <CardContent>
                {loading && inventory.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading inventory...</span>
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">No inventory found.</p>
                    <p className="text-sm">Click "Sync Now" to fetch your inventory from Amazon.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>ASIN</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Reserved</TableHead>
                          <TableHead>Inbound</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Location</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item) => (
                          <TableRow key={item.sku}>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell className="font-mono text-sm">{item.asin || '—'}</TableCell>
                            <TableCell className="text-sm text-gray-300">{item.productName || '—'}</TableCell>
                            <TableCell>{item.quantityAvailable ?? '—'}</TableCell>
                            <TableCell>{item.quantityReserved ?? '—'}</TableCell>
                            <TableCell>{item.quantityInbound ?? '—'}</TableCell>
                            <TableCell className="font-semibold">{item.quantityTotal ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.condition || '—'}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-300">{item.warehouseLocation || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Select value={ordersFilters.status || 'all'} onValueChange={(v) => setOrdersFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All Statuses" className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ordersFilters.fulfillmentChannel || 'all'} onValueChange={(v) => setOrdersFilters(prev => ({ ...prev, fulfillmentChannel: v === 'all' ? '' : v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All Channels" className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="FBA">FBA</SelectItem>
                      <SelectItem value="FBM">FBM</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Orders</CardTitle>
                <CardDescription>Your Amazon order data</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && orders.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-2">No orders found.</p>
                    {!userId ? (
                      <p className="text-sm">Please connect your Amazon account to view orders.</p>
                    ) : (
                      <p className="text-sm">Click "Sync Now" to fetch your orders from Amazon.</p>
                    )}
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
                        {orders.map((order) => (
                          <TableRow key={order.id || order.order_id}>
                            <TableCell className="font-mono text-sm">{order.order_id || '—'}</TableCell>
                            <TableCell>{formatDate(order.order_date)}</TableCell>
                            <TableCell>{getStatusBadge(order.order_status || 'Unknown')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.fulfillment_channel || '—'}</Badge>
                            </TableCell>
                            <TableCell>{order.items?.length || 0} item(s)</TableCell>
                            <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                            <TableCell>{order.currency || 'USD'}</TableCell>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Select value={shipmentsFilters.status || 'all'} onValueChange={(v) => setShipmentsFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All Statuses" className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipments Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Shipments</CardTitle>
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
                        {shipments.map((shipment) => (
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Select value={returnsFilters.status || 'all'} onValueChange={(v) => setReturnsFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All Statuses" className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Returns Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Returns</CardTitle>
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
                        {returns.map((ret) => (
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                  <Select value={settlementsFilters.transactionType || 'all'} onValueChange={(v) => setSettlementsFilters(prev => ({ ...prev, transactionType: v === 'all' ? '' : v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All Types" className="text-white" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                    placeholder="Start Date"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settlements Table */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Settlements</CardTitle>
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
                        {settlements.map((settlement) => (
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

      {/* Evidence Connections Prompt */}
      <Dialog open={showEvidencePrompt} onOpenChange={setShowEvidencePrompt}>
        <DialogContent className="max-w-lg bg-[whitesmoke] backdrop-blur-md border border-gray-200 text-gray-900 shadow-[0_20px_80px_rgba(15,23,42,0.25)] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900">
              Connect Doc Sources
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Link your email and cloud storage to automatically collect invoices, receipts, and shipping documents.
              <span className="block mt-2 text-sm text-slate-600">
                Read-only access. No writing or sending permissions.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button className="w-full bg-red-600 hover:bg-red-500 text-white border border-transparent shadow-sm" onClick={async () => {
              try {
                const r = await api.connectDocs('gmail');
                if (r.ok && r.data?.auth_url) {
                  window.location.href = r.data.auth_url;
                } else {
                  toast({
                    title: 'Connection Failed',
                    description: r.error || 'Failed to initiate Gmail connection. Please try again.',
                    variant: 'destructive',
                  });
                }
              } catch (error) {
                console.error('Failed to connect Gmail:', error);
                toast({
                  title: 'Connection Failed',
                  description: 'An error occurred while connecting Gmail. Please try again.',
                  variant: 'destructive',
                });
              }
            }}>
              <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 mr-2 object-contain" /> Gmail
            </Button>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('outlook');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Outlook connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Outlook:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Outlook. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 mr-2 object-contain" /> Outlook
            </Button>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('gdrive');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Google Drive connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Google Drive:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Google Drive. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/gd.png" alt="Google Drive" className="h-4 w-4 mr-2 object-contain" /> Google Drive
            </Button>
            <Button 
              className="w-full bg-sky-600 hover:bg-sky-500 text-white border border-transparent shadow-sm"
              onClick={async () => {
                try {
                  const r = await api.connectDocs('dropbox');
                  if (r.ok && r.data?.auth_url) {
                    window.location.href = r.data.auth_url;
                  } else {
                    toast({
                      title: 'Connection Failed',
                      description: r.error || 'Failed to initiate Dropbox connection. Please try again.',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Failed to connect Dropbox:', error);
                  toast({
                    title: 'Connection Failed',
                    description: 'An error occurred while connecting Dropbox. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <img src="/db.png" alt="Dropbox" className="h-4 w-4 mr-2 object-contain" /> Dropbox
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => { setShowEvidencePrompt(false); try { localStorage.setItem('clario.evidencePromptDismissed', 'true'); } catch {} }}>Not now</Button>
            <Button onClick={() => setShowEvidencePrompt(false)} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
              <ArrowRight className="h-4 w-4" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
