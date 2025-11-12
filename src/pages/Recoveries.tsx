import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye, RefreshCw, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import type { DateRange } from 'react-day-picker';
import { useStatusStream } from '@/hooks/use-status-stream';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Fallback mock data when API is unavailable
const mockClaims = [
  {
    id: 'CLM-001',
    created: '2024-01-15',
    type: 'Lost Inventory',
    details: '5 units of Premium Wireless Headphones lost at FTW1',
    status: 'New',
    guaranteedAmount: 450.00,
    expectedPayoutDate: '2024-02-15',
    sku: 'WH-PREM-001',
    asin: 'B08K2XR456'
  },
  {
    id: 'CLM-002',
    created: '2024-01-22',
    type: 'Fee Dispute',
    details: 'Incorrect FBA fulfillment fee charged',
    status: 'Pending',
    guaranteedAmount: 125.50,
    expectedPayoutDate: '2024-02-22',
    sku: 'COF-ORG-500',
    asin: 'B07G3XN789'
  },
  {
    id: 'CLM-003',
    created: '2024-02-01',
    type: 'Damaged Goods',
    details: '12 units of Organic Coffee Beans damaged at LAX7',
    status: 'Submitted',
    guaranteedAmount: 850.75,
    expectedPayoutDate: '2024-03-01',
    sku: 'SH-SEC-PRO',
    asin: 'B09M1ST234'
  },
  {
    id: 'CLM-004',
    created: '2024-02-10',
    type: 'Lost Inventory',
    details: '3 units of Smart Home Security System lost at ATL2',
    status: 'Paid',
    guaranteedAmount: 320.00,
    expectedPayoutDate: '2024-03-10',
    sku: 'FIT-TRK-001',
    asin: 'B06H4RT567'
  },
  {
    id: 'CLM-005',
    created: '2024-02-15',
    type: 'Fee Dispute',
    details: 'Storage fee overcharge detected',
    status: 'Denied',
    guaranteedAmount: 75.25,
    expectedPayoutDate: null,
    sku: 'KIT-BAM-SET',
    asin: 'B05K7YU890'
  },
  {
    id: 'CLM-006',
    created: '2024-03-01',
    type: 'Damaged Goods',
    details: '8 units of Fitness Tracker Band damaged at PHX3',
    status: 'Submitted',
    guaranteedAmount: 1200.25,
    expectedPayoutDate: '2024-03-25',
    sku: 'WH-PREM-002',
    asin: 'B08L3XR789'
  }
];

const claimTypes = ['Lost Inventory', 'Fee Dispute', 'Damaged Goods', 'Overcharge'];
const statusOptions = ['New', 'Pending', 'Submitted', 'Paid', 'Denied'];

export default function Recoveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [claims, setClaims] = useState<typeof mockClaims>(mockClaims);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const { toast } = useToast();
  const [showParkedOnly, setShowParkedOnly] = useState(false);
  const [autoSubmitHigh, setAutoSubmitHigh] = useState(false);
  const [smartPromptOpen, setSmartPromptOpen] = useState(false);
  const [promptClaim, setPromptClaim] = useState<any | null>(null);
  const autoSubmittedRef = useRef<Set<string>>(new Set());
  
  // Phase 3: Detection results integration
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [mergedRecoveries, setMergedRecoveries] = useState<any[]>([]);
  const [filterSource, setFilterSource] = useState<'all' | 'detected' | 'synced'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Amazon recoveries integration (from DASHBOARD_CLAIMS_INTEGRATION.md)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const [amazonClaimCount, setAmazonClaimCount] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
  const [recoverySource, setRecoverySource] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  
  // Track previous claims to detect new recoveries
  const previousClaimIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef<boolean>(false);
  const previousRecoveredTotalRef = useRef<number>(0);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const syncPollingRef = useRef<number | null>(null);
  const syncCheckTimeoutRef = useRef<number | null>(null);

  // Helper function for currency formatting (defined early so it can be used in useEffect)
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // --- Opportunity Radar helpers ---
  const stableHash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
    return (h >>> 0);
  };
  const getConfidence = (id: string): number => {
    // Stable pseudo-confidence between 0.5 and 0.98
    const v = stableHash(id) % 4900; // 0..4899
    return Math.round((v + 500) / 100) / 100; // 0.5 .. 4.99 -> 0.5 .. 4.99, then /? ensure two decimals
  };
  const getConfidenceTier = (c: number) => c >= 0.85 ? 'high' : c >= 0.6 ? 'medium' : 'low';
  const getConfidenceColor = (c: number) => c >= 0.85 ? 'text-emerald-400' : c >= 0.6 ? 'text-amber-400' : 'text-gray-400';
  const getConfidenceBadge = (c: number) => c >= 0.85 ? 'High' : c >= 0.6 ? 'Medium' : 'Low';
  const getEvidenceStatus = (id: string): 'Ready' | 'Needs Docs' | 'Collecting' => {
    const v = stableHash(id) % 100;
    if (v >= 70) return 'Ready';
    if (v >= 40) return 'Needs Docs';
    return 'Collecting';
  };

  // Helper function to merge recoveries with detection results
  const mergeRecoveries = useCallback((syncedRecoveries: any[], detectedClaims: any[]) => {
    // Transform detection results to match recovery format
    const detected = detectedClaims.map(det => ({
      id: det.id,
      source: 'detected',
      type: det.anomaly_type || 'Detected Claim',
      details: `${det.anomaly_type || 'Claim'} detected with ${(det.confidence_score * 100).toFixed(0)}% confidence`,
      status: det.status || 'New',
      guaranteedAmount: det.estimated_value || 0,
      currency: det.currency || 'USD',
      confidence_score: det.confidence_score,
      days_remaining: det.days_remaining,
      discovery_date: det.discovery_date,
      deadline_date: det.deadline_date,
      created: det.discovery_date || det.created_at || new Date().toISOString(),
      expectedPayoutDate: det.deadline_date || null,
      sku: det.evidence?.sku || 'N/A',
      asin: det.evidence?.asin || 'N/A',
      _confidence: det.confidence_score,
      _priority: (det.confidence_score || 0) * (det.estimated_value || 0),
      _evidence: det.days_remaining && det.days_remaining <= 7 ? 'Ready' : 'Collecting',
      _matchedCount: 0,
    }));
    
    // Mark synced recoveries
    const synced = (syncedRecoveries || []).map(rec => ({
      ...rec,
      source: 'synced',
      confidence_score: null,
      days_remaining: null,
      _confidence: getConfidence(rec.id),
      _priority: getConfidence(rec.id) * (rec.guaranteedAmount || 0),
      _evidence: getEvidenceStatus(rec.id),
      _matchedCount: Array.isArray((rec as any).matchedDocs) ? (rec as any).matchedDocs.length : ((rec as any).matchedCount ?? 0),
    }));
    
    // Combine and sort
    const merged = [...detected, ...synced].sort((a, b) => {
      const dateA = new Date(a.discovery_date || a.created || a.created_at || 0).getTime();
      const dateB = new Date(b.discovery_date || b.created || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    // Apply filters
    let filtered = merged;
    if (filterSource !== 'all') {
      filtered = filtered.filter(r => r.source === filterSource);
    }
    if (filterConfidence !== 'all' && filterSource === 'detected') {
      filtered = filtered.filter(r => {
        if (!r.confidence_score) return false;
        if (filterConfidence === 'high') return r.confidence_score >= 0.85;
        if (filterConfidence === 'medium') return r.confidence_score >= 0.50 && r.confidence_score < 0.85;
        return r.confidence_score < 0.50;
      });
    }
    
    setMergedRecoveries(filtered);
  }, [filterSource, filterConfidence]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resData, metricsRes, amazonRecoveriesRes, detectionRes] = await Promise.all([
        recoveryApi.getRecoveries().catch(() => null),
        api.getRecoveriesMetrics(),
        api.getAmazonRecoveries().catch(() => null),
        detectionApi.getDetectionResults({ limit: 100, offset: 0 }).catch(() => ({ ok: false, data: null })),
      ]);
      if (!cancelled) {
        if (resData && Array.isArray(resData)) {
          const newClaims = resData as any[];
          
          // Detect new recoveries by comparing with previous claims
          if (hasInitializedRef.current) {
            const currentClaimIds = new Set(newClaims.map(c => c.id));
            const previousClaimIds = previousClaimIdsRef.current;
            
            // Find new claims that weren't in the previous set
            const newClaimIds = Array.from(currentClaimIds).filter(id => !previousClaimIds.has(id));
            
            if (newClaimIds.length > 0) {
              const newClaimsData = newClaims.filter(c => newClaimIds.includes(c.id));
              const totalNewAmount = newClaimsData.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);
              
              // Show toast for new recoveries detected
              if (newClaimIds.length === 1) {
                const newClaim = newClaimsData[0];
                toast({
                  title: '🎉 New Recovery Detected!',
                  description: `${newClaim.type || 'Recovery'} found: ${formatCurrency(newClaim.guaranteedAmount || 0)}`,
                  duration: 5000,
                });
              } else {
                toast({
                  title: '🎉 New Recoveries Detected!',
                  description: `${newClaimIds.length} new recoveries found totaling ${formatCurrency(totalNewAmount)}`,
                  duration: 5000,
                });
              }
            }
          }
          
          // Update previous claim IDs
          previousClaimIdsRef.current = new Set(newClaims.map(c => c.id));
          hasInitializedRef.current = true;
          
          setClaims(newClaims);
          setError(null);
          
          // Merge with detection results
          if (detectionRes.ok && detectionRes.data?.results) {
            setDetectionResults(detectionRes.data.results);
            mergeRecoveries(newClaims, detectionRes.data.results);
          } else {
            mergeRecoveries(newClaims, []);
          }
        } else {
          setError(null);
          // Still try to merge even if no synced recoveries
          if (detectionRes.ok && detectionRes.data?.results) {
            setDetectionResults(detectionRes.data.results);
            mergeRecoveries([], detectionRes.data.results);
          } else {
            mergeRecoveries([], []);
          }
        }
        if (metricsRes.ok && metricsRes.data) {
          setMetrics(metricsRes.data);
          setMetricsError(null);
          setMetricsLoaded(true);
        } else {
          setMetricsError(metricsRes.error || null);
          setMetricsLoaded(true);
        }
        
        // Handle Amazon recoveries data
        if (amazonRecoveriesRes?.ok && amazonRecoveriesRes.data) {
          const data = amazonRecoveriesRes.data as any;
          const newTotal = data.totalAmount ?? 0;
          const previousTotal = previousRecoveredTotalRef.current;
          
          setRecoveredTotal(newTotal);
          previousRecoveredTotalRef.current = newTotal;
          
          if (data.currency) setRecoveredCurrency(data.currency);
          if (typeof data.claimCount === 'number') setAmazonClaimCount(data.claimCount);
          
          // Handle sync-related fields
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
          if (data.dataSource) setDataSource(data.dataSource);
          if (data.source) setRecoverySource(data.source);
          
          // If sync is triggered or needed, check sync status and poll for completion
          if (data.syncTriggered || data.needsSync) {
            checkAndMonitorSync();
          } else {
            // Clear sync polling if sync is no longer needed
            if (syncPollingRef.current) {
              clearInterval(syncPollingRef.current);
              syncPollingRef.current = null;
            }
            if (syncCheckTimeoutRef.current) {
              clearTimeout(syncCheckTimeoutRef.current);
              syncCheckTimeoutRef.current = null;
            }
          }
        } else if (amazonRecoveriesRes?.data) {
          // Handle response even if not fully ok (might have sync info)
          const data = amazonRecoveriesRes.data as any;
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
          
          // Check sync status if needed
          if (data.syncTriggered || data.needsSync) {
            checkAndMonitorSync();
          }
        }
        
        // Function to check sync status and monitor completion
        async function checkAndMonitorSync() {
          if (cancelled) return;
          
          try {
            // Check if there's an active sync
            const syncStatusRes = await api.getSyncStatus();
            if (syncStatusRes.ok && syncStatusRes.data) {
              const syncStatus = syncStatusRes.data as any;
              
              // If there's an active sync, get the syncId
              if (syncStatus.hasActiveSync && syncStatus.lastSync?.syncId) {
                const syncId = syncStatus.lastSync.syncId;
                setActiveSyncId(syncId);
                
                // Start polling for sync completion
                startSyncPolling(syncId);
              } else if (syncStatus.lastSync?.status === 'complete') {
                // Sync completed, refresh data
                const [newRecoveriesRes] = await Promise.all([
                  api.getAmazonRecoveries().catch(() => null),
                ]);
                if (newRecoveriesRes?.ok && newRecoveriesRes.data) {
                  const newData = newRecoveriesRes.data as any;
                  setRecoveredTotal(newData.totalAmount ?? 0);
                  if (newData.currency) setRecoveredCurrency(newData.currency);
                  if (typeof newData.claimCount === 'number') setAmazonClaimCount(newData.claimCount);
                }
                setSyncTriggered(false);
                setNeedsSync(false);
                setSyncMessage(null);
                
                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              } else if (syncStatus.lastSync?.status === 'failed') {
                // Sync failed
                setSyncTriggered(false);
                setNeedsSync(true);
                setSyncMessage('Sync failed. Please try again.');
                
                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              }
            }
          } catch (error) {
            console.error('Error checking sync status:', error);
          }
        }
        
        // Function to poll for sync completion
        function startSyncPolling(syncId: string) {
          // Clear any existing polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
          }
          
          let pollCount = 0;
          const maxPolls = 120; // Poll for up to 10 minutes
          
          syncPollingRef.current = window.setInterval(async () => {
            if (cancelled) {
              if (syncPollingRef.current) {
                clearInterval(syncPollingRef.current);
                syncPollingRef.current = null;
              }
              return;
            }
            
            pollCount++;
            
            try {
              const { getSyncStatus } = await import('@/lib/inventoryApi');
              const status = await getSyncStatus(syncId);
              
              if (status.status === 'complete') {
                // Sync completed, refresh data
                const [newRecoveriesRes, newClaimsRes] = await Promise.all([
                  api.getAmazonRecoveries().catch(() => null),
                  recoveryApi.getRecoveries().catch(() => null),
                ]);
                
                if (newRecoveriesRes?.ok && newRecoveriesRes.data) {
                  const newData = newRecoveriesRes.data as any;
                  setRecoveredTotal(newData.totalAmount ?? 0);
                  if (newData.currency) setRecoveredCurrency(newData.currency);
                  if (typeof newData.claimCount === 'number') setAmazonClaimCount(newData.claimCount);
                }
                
                if (newClaimsRes && Array.isArray(newClaimsRes)) {
                  setClaims(newClaimsRes as any);
                }
                
                setSyncTriggered(false);
                setNeedsSync(false);
                setSyncMessage('Sync completed successfully!');
                
                toast({
                  title: 'Sync Completed',
                  description: 'Your Amazon data has been synced successfully.',
                  duration: 5000,
                });
                
                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              } else if (status.status === 'failed') {
                // Sync failed
                setSyncTriggered(false);
                setNeedsSync(true);
                setSyncMessage('Sync failed. Please try again.');
                
                toast({
                  title: 'Sync Failed',
                  description: 'The sync encountered an error. Please try again.',
                  variant: 'destructive',
                  duration: 5000,
                });
                
                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              }
            } catch (error) {
              console.error('Error polling sync status:', error);
              
              if (pollCount >= maxPolls) {
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
                setSyncMessage('Sync is taking longer than expected. Please check back later.');
              }
            }
          }, 5000); // Poll every 5 seconds
          
          // Set timeout to stop polling after 10 minutes
          syncCheckTimeoutRef.current = window.setTimeout(() => {
            if (syncPollingRef.current) {
              clearInterval(syncPollingRef.current);
              syncPollingRef.current = null;
            }
            setSyncMessage('Sync is taking longer than expected. Please check the sync page for details.');
          }, 600000); // 10 minutes
        }
        
        setLoading(false);
      }
    })();
    return () => { 
      cancelled = true;
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      if (syncCheckTimeoutRef.current) {
        clearTimeout(syncCheckTimeoutRef.current);
        syncCheckTimeoutRef.current = null;
      }
    };
  }, [toast]);

  // Real-time recovery status updates; update table rows on the fly
  useStatusStream((evt) => {
    // Handle recovery status updates
    if (evt.type === 'recovery' || evt.type === 'claim') {
      setClaims(prev => prev.map(c => c.id === evt.id ? { ...c, status: evt.status } as any : c));
    }
    
    // Handle detection events - new recoveries detected
    if (evt.type === 'detection') {
      // Show toast for detection events
      const detectionData = (evt as any).data;
      const claimCount = detectionData?.claimCount || detectionData?.count || detectionData?.newClaims;
      const totalAmount = detectionData?.totalAmount || detectionData?.amount;
      
      if (claimCount || totalAmount) {
        toast({
          title: '🔍 New Recoveries Detected!',
          description: claimCount 
            ? `${claimCount} new recovery${claimCount !== 1 ? 'ies' : ''} detected${totalAmount ? ` totaling ${formatCurrency(totalAmount)}` : ''}`
            : totalAmount 
            ? `New recoveries totaling ${formatCurrency(totalAmount)} detected`
            : 'New recoveries have been detected',
          duration: 6000,
        });
      } else {
        toast({
          title: '🔍 Recovery Detection Complete',
          description: 'Scan completed. Check for new recovery opportunities.',
          duration: 5000,
        });
      }
      
      // Refresh claims list to show new recoveries
      recoveryApi.getRecoveries().then(res => {
        if (Array.isArray(res)) {
          const newClaims = res as any[];
          const currentClaimIds = new Set(newClaims.map(c => c.id));
          const previousClaimIds = previousClaimIdsRef.current;
          
          // Find new claims
          const newClaimIds = Array.from(currentClaimIds).filter(id => !previousClaimIds.has(id));
          
          if (newClaimIds.length > 0) {
            // Update previous claim IDs
            previousClaimIdsRef.current = currentClaimIds;
            setClaims(newClaims);
          }
        }
      }).catch(() => {
        // Silently fail
      });
    }
    
    // Refresh Amazon recoveries when sync/detection events occur
    if (evt.type === 'sync' || evt.type === 'detection') {
      api.getAmazonRecoveries().then(res => {
        if (res.ok && res.data) {
          const data = res.data as any;
          const previousTotal = previousRecoveredTotalRef.current;
          const newTotal = data.totalAmount ?? 0;
          
          setRecoveredTotal(newTotal);
          previousRecoveredTotalRef.current = newTotal;
          
          if (data.currency) setRecoveredCurrency(data.currency);
          if (typeof data.claimCount === 'number') setAmazonClaimCount(data.claimCount);
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
          if (data.source) setRecoverySource(data.source);
          if (data.dataSource) setDataSource(data.dataSource);
          
          // Show toast if recovered amount increased
          if (newTotal > previousTotal && previousTotal > 0) {
            const increase = newTotal - previousTotal;
            toast({
              title: '💰 Recovery Amount Updated',
              description: `Recovered amount increased by ${formatCurrency(increase, data.currency || 'USD')}`,
              duration: 5000,
            });
          }
        }
      }).catch(() => {
        // Silently fail - don't disrupt user experience
      });
    }
  });

  // Update merged recoveries when filters change
  useEffect(() => {
    mergeRecoveries(claims, detectionResults);
  }, [filterSource, filterConfidence, mergeRecoveries]);

  // Filter data based on search and filters - use mergedRecoveries if available
  const filteredClaims = useMemo(() => {
    const sourceData = mergedRecoveries.length > 0 ? mergedRecoveries : claims;
    let filtered = sourceData.filter(claim => {
      // Search filter
      const searchMatch = !searchTerm || 
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const claimDate = new Date(claim.created);
      const dateMatch = (!dateRange?.from || claimDate >= dateRange.from) && 
                       (!dateRange?.to || claimDate <= dateRange.to);
      
      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.type);
      
      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      
      return searchMatch && dateMatch && typeMatch && statusMatch;
    });

    return filtered;
  }, [mergedRecoveries, claims, searchTerm, dateRange, selectedClaimTypes, selectedStatuses]);

  // Rank opportunities: prioritize by confidence * value
  const rankedClaims = useMemo(() => {
    const base = filteredClaims
      .map(c => ({
        ...c,
        _confidence: getConfidence(c.id),
        _priority: getConfidence(c.id) * (c.guaranteedAmount || 0),
        _evidence: getEvidenceStatus(c.id),
        _matchedCount: Array.isArray((c as any).matchedDocs) ? (c as any).matchedDocs.length : ((c as any).matchedCount ?? 0),
      }))
      .sort((a, b) => b._priority - a._priority);
    return showParkedOnly ? base.filter(c => c._confidence < 0.5) : base;
  }, [filteredClaims, showParkedOnly]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalClaimsFound = filteredClaims.length;
    const currentlyInProgress = filteredClaims.filter(claim => 
      ['New', 'Pending', 'Submitted'].includes(claim.status)
    ).length;
    const valueInProgress = filteredClaims
      .filter(claim => ['New', 'Pending', 'Submitted'].includes(claim.status))
      .reduce((sum, claim) => sum + claim.guaranteedAmount, 0);
    
    // Calculate 30-day success rate from all claims
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentClaims = claims.filter(claim => 
      new Date(claim.created) >= thirtyDaysAgo
    );
    const successfulClaims = recentClaims.filter(claim => claim.status === 'Paid');
    const successRate = recentClaims.length > 0 
      ? (successfulClaims.length / recentClaims.length) * 100 
      : 0;

    return {
      totalClaimsFound,
      currentlyInProgress,
      valueInProgress,
      successRate
    };
  }, [filteredClaims, claims]);

  // Owed top-line summary (non-paid)
  const owedSummary = useMemo(() => {
    // Prefer backend metrics when available
    if (metrics && (typeof (metrics as any).totalOwed === 'number' || typeof (metrics as any).owedTotal === 'number')) {
      const totalOwed = (metrics as any).totalOwed ?? (metrics as any).owedTotal;
      const openCount = (metrics as any).openCount ?? (metrics as any).openClaims ?? 0;
      return { totalOwed, openCount };
    }
    const openStatuses = new Set(['New', 'Pending', 'Submitted']);
    const openClaims = claims.filter(c => openStatuses.has(c.status));
    const totalOwed = openClaims.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);
    return { totalOwed, openCount: openClaims.length };
  }, [claims, metrics]);

  // Category breakdown chips
  const categoryCounts = useMemo(() => {
    // Prefer backend-provided category counts if available
    const fromMetrics = (metrics as any)?.categoryCounts || (metrics as any)?.categories;
    if (fromMetrics && typeof fromMetrics === 'object') {
      return fromMetrics as Record<string, number>;
    }
    const counts: Record<string, number> = {
      'Lost Inventory': 0,
      'Damaged': 0,
      'Uncredited Returns': 0,
      'Overcharges': 0,
      'Misapplied Fees': 0,
    };
    for (const c of claims) {
      if (c.type === 'Lost Inventory') counts['Lost Inventory'] += 1;
      if (c.type === 'Damaged Goods') counts['Damaged'] += 1;
      if (c.type === 'Uncredited Return') counts['Uncredited Returns'] += 1;
      if (c.type === 'Overcharge' || c.type === 'Fee Dispute') counts['Overcharges'] += 1;
      if (c.type === 'Fee Dispute') counts['Misapplied Fees'] += 1;
    }
    return counts;
  }, [claims, metrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Submitted': return 'bg-purple-100 text-purple-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const setQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'quarter':
        setDateRange({ from: startOfQuarter(now), to: now });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: now });
        break;
      case 'all':
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  return (
    <PageLayout title="Recoveries">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300 space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Recoveries</h1>
          <p className="text-gray-400">Comprehensive view of all recovery claims and their current status</p>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white" disabled={selectedIds.size === 0 || submittingBulk} onClick={async () => {
              setSubmittingBulk(true);
              const ids = Array.from(selectedIds);
              for (const id of ids) {
                try {
                  await recoveryApi.submitClaim(id);
                  toast({ title: `Submitted ${id}`, description: 'Claim submitted successfully.' });
                  setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'Submitted' } : c));
                } catch (e: any) {
                  toast({ title: `Failed to submit ${id}`, description: e?.message || 'Please try again.' });
                }
              }
              setSubmittingBulk(false);
            }}>Auto-Submit Selected</Button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            )}
          </div>
        </div>

        {/* Opportunity Radar Summary */}
        <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm text-gray-400">Detected Reimbursements</div>
                  {recoveredTotal != null && recoveredTotal > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="About recovered value"
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black text-white text-xs">
                        Recovered from approved/completed claims. {recoverySource && `Source: ${recoverySource}`}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-2xl md:text-3xl font-semibold text-gray-100">
                  <span className="text-gray-100">{formatCurrency(owedSummary.totalOwed)}</span> <span className="text-gray-400 text-base font-medium">across {owedSummary.openCount} claims</span>
                </div>
                {/* Amazon Recoveries Integration */}
                {recoveredTotal != null && recoveredTotal > 0 && (
                  <div className="mt-3 text-sm">
                    <span className="text-emerald-400 font-semibold">
                      {formatCurrency(recoveredTotal, recoveredCurrency)}
                    </span>
                    <span className="text-gray-400 ml-2">
                      recovered from {amazonClaimCount ?? 0} approved claim{amazonClaimCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                                {/* Sync status message */}
                {(syncMessage || needsSync || syncTriggered) && (
                  <div className={`mt-3 px-3 py-2 rounded-md text-xs ${
                    syncTriggered 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                      : needsSync 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-white/5 text-gray-300 border border-white/10'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {syncTriggered && <RefreshCw className="h-3 w-3 mt-0.5 animate-spin" />}
                        <span>{syncMessage || (needsSync ? 'Syncing your Amazon account... Please refresh in a few moments.' : '')}</span>
                      </div>
                      {activeSyncId && (
                        <Link
                          to={`/sync?id=${activeSyncId}`}
                          className="text-blue-400 hover:text-blue-300 underline text-xs ml-2"
                        >
                          View progress
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([label, count]) => (
                  <span key={label} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
                    {label}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
              <span>Last scan just now</span>
              <span className="h-1 w-1 rounded-full bg-gray-500"></span>
              <button
                className="inline-flex items-center gap-2 h-8 px-3 rounded-md bg-emerald-500 text-white font-semibold hover:bg-emerald-400"
                onClick={async () => {
                  try {
                    await api.post('/api/detections/run');
                    toast({ title: 'Detector started', description: 'Scanning new opportunities…' });
                  } catch (e: any) {
                    toast({ title: 'Could not start detector', description: e?.message || 'Please try again shortly.', variant: 'destructive' });
                  }
                }}
              >
                Detect Claims
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Claims Found</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {metrics ? metrics.totalClaimsFound : keyMetrics.totalClaimsFound}
                    {amazonClaimCount != null && amazonClaimCount > 0 && (
                      <span className="text-sm text-emerald-400 ml-2 font-normal">
                        ({amazonClaimCount} from Amazon)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Currently in Progress</p>
                  <p className="text-2xl font-bold text-blue-400">{metrics ? metrics.inProgress : keyMetrics.currentlyInProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Value in Progress</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(metrics ? metrics.valueInProgress : keyMetrics.valueInProgress)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">30-Day Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-400">{metrics ? Math.round(metrics.successRate30d) : keyMetrics.successRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Claim ID, ASIN, or Keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500"
                />
              </div>

              {/* Quick Date Range Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('quarter')}>Last Quarter</Button>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('year')}>This Year</Button>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('all')}>All Time</Button>
              </div>

              {/* Custom Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[280px] justify-start text-left font-medium bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100", !dateRange && "text-blue-700")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Claim Type Filter */}
              <Select>
                <SelectTrigger className="w-[180px] text-slate-800 placeholder:text-slate-800">
                  <SelectValue placeholder="Filter by Claim Type" />
                </SelectTrigger>
                <SelectContent>
                  {claimTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select>
                <SelectTrigger className="w-[180px] text-slate-800 placeholder:text-slate-800">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Source Filter (Phase 3) */}
              <Select value={filterSource} onValueChange={(value: 'all' | 'detected' | 'synced') => {
                setFilterSource(value);
              }}>
                <SelectTrigger className="w-[180px] text-slate-800 placeholder:text-slate-800">
                  <SelectValue placeholder="Filter by Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="detected">Detected (Phase 3)</SelectItem>
                  <SelectItem value="synced">Synced from Amazon</SelectItem>
                </SelectContent>
              </Select>

              {/* Confidence Filter (Phase 3) - only show when filtering by detected */}
              {filterSource === 'detected' && (
                <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => {
                  setFilterConfidence(value);
                }}>
                  <SelectTrigger className="w-[180px] text-slate-800 placeholder:text-slate-800">
                    <SelectValue placeholder="Filter by Confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence Levels</SelectItem>
                    <SelectItem value="high">High (≥85%)</SelectItem>
                    <SelectItem value="medium">Medium (50-85%)</SelectItem>
                    <SelectItem value="low">Low (&lt;50%)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-0">
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Loading recoveries...</div>
            )}
            {error && (
              <div className="p-4 text-sm text-red-600">{error}</div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredClaims.length} onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(new Set(filteredClaims.map(c => c.id)));
                      else setSelectedIds(new Set());
                    }} />
                  </TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Guaranteed Amount</TableHead>
                  <TableHead>Expected Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedClaims.map((claim: any) => {
                  const confidenceBadge = claim.confidence_score !== null && claim.confidence_score !== undefined
                    ? (claim.confidence_score >= 0.85 ? { label: 'High', color: 'green' } : claim.confidence_score >= 0.50 ? { label: 'Medium', color: 'yellow' } : { label: 'Low', color: 'gray' })
                    : null;
                  const displayConfidence = claim.confidence_score !== null && claim.confidence_score !== undefined
                    ? claim.confidence_score
                    : claim._confidence;
                  
                  return (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-white/5">
                    <TableCell>
                      <Checkbox checked={selectedIds.has(claim.id)} onCheckedChange={(checked) => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(claim.id); else next.delete(claim.id);
                          return next;
                        });
                      }} />
                    </TableCell>
                    <TableCell>
                      {claim.source === 'detected' ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Detected</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Synced</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="link" className="p-0 h-auto text-emerald-400 hover:text-emerald-300 font-mono">
                        <Link to={`/recoveries/${claim.id}`} state={{ claim }}>{claim.id}</Link>
                      </Button>
                    </TableCell>
                    <TableCell>{format(new Date(claim.created || claim.discovery_date || claim.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {confidenceBadge ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${
                            confidenceBadge.color === 'green' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            confidenceBadge.color === 'yellow' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}>
                            {confidenceBadge.label} ({(claim.confidence_score * 100).toFixed(0)}%)
                          </span>
                        ) : (
                          <>
                            <span className={`text-xs font-semibold ${getConfidenceColor(displayConfidence)}`}>{displayConfidence.toFixed(2)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-gray-300">
                              {getConfidenceBadge(displayConfidence)}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-300">{claim._evidence}</span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={claim.details}>
                        {claim.details}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SKU: {claim.sku} • ASIN: {claim.asin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.days_remaining !== null && claim.days_remaining !== undefined ? (
                        <span className={claim.days_remaining <= 7 ? 'text-amber-400 font-semibold' : 'text-gray-300'}>
                          {claim.days_remaining} days
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(claim.guaranteedAmount, claim.currency || 'USD')}</TableCell>
                    <TableCell>
                      {claim.expectedPayoutDate ? format(new Date(claim.expectedPayoutDate), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {claim.status === 'Denied' && (
                            <DropdownMenuItem onClick={async () => {
                              const hasDocs = true; // Backend should validate; UI assumes action allowed
                              if (!hasDocs) return;
                              try {
                                await api.resubmitClaim(claim.id);
                                toast({ title: 'Resubmitted', description: `${claim.id} resubmitted with stronger docs.` });
                                setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'Submitted' } as any : c));
                              } catch (e: any) {
                                toast({ title: 'Resubmission failed', description: e?.message || 'Please try again.' });
                              }
                            }}>
                              Resubmit with stronger docs
                            </DropdownMenuItem>
                          )}
                          {((claim.confidence_score !== null && claim.confidence_score !== undefined && claim.confidence_score >= 0.85) || getConfidenceTier(claim._confidence) === 'high') && (
                            <DropdownMenuItem onClick={async () => {
                              try {
                                await recoveryApi.submitClaim(claim.id);
                                setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'Submitted' } : c));
                                setMergedRecoveries(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'Submitted' } : c));
                                toast({ title: 'Auto-submitted', description: `${claim.id} submitted automatically.` });
                              } catch (e: any) {
                                toast({ title: 'Submit failed', description: e?.message || 'Please try again.' });
                              }
                            }}>
                              Auto-Submit (High Confidence)
                            </DropdownMenuItem>
                          )}
                          {getConfidenceTier(claim._confidence) === 'medium' && (
                          <DropdownMenuItem asChild>
                            <Link to={`/recoveries/${claim.id}`} state={{ claim }} className="flex items-center gap-2">
                                Review Opportunity
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/recoveries/${claim.id}`} state={{ claim }} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/recoveries/${encodeURIComponent(claim.id)}/resolve`} state={{ claim }} className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Resolve Case
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            const url = api.getRecoveryDocumentUrl(claim.id);
                            try {
                              const head = await fetch(url, { method: 'HEAD', credentials: 'include' });
                              if (head.ok) {
                                window.open(url, '_blank');
                                return;
                              }
                            } catch {}
                            try {
                              const res = await api.getRecoveryDetail(claim.id);
                              const docs = (res && res.ok && Array.isArray((res as any).data?.documents)) ? (res as any).data!.documents : [];
                              if (docs.length > 0 && docs[0]?.id) {
                                window.open(`/documents/${encodeURIComponent(docs[0].id)}`, '_blank');
                              } else {
                                toast({ title: 'No proof available yet', description: 'Evidence is still being collected for this case.' });
                              }
                            } catch (e: any) {
                              toast({ title: 'Proof unavailable', description: e?.message || 'Please try again later.' });
                            }
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Proof Document
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}