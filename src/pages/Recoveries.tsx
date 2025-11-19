import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye, RefreshCw, Info, AlertTriangle, X, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
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
  const [mergedRecoveries, setMergedRecoveries] = useState<any[] | null>(null); // null means not initialized yet
  const [filterSource, setFilterSource] = useState<'all' | 'detected' | 'synced'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Phase 3: Detection statistics and urgent claims
  const [detectionStats, setDetectionStats] = useState<any>(null);
  const [urgentClaims, setUrgentClaims] = useState<any[]>([]);
  const [urgentClaimsCount, setUrgentClaimsCount] = useState<number>(0);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAmount, setResolveAmount] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detectionDetails, setDetectionDetails] = useState<any | null>(null);
  
  // Table drag-to-scroll functionality
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle mouse down for drag scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableScrollRef.current) return;
    const target = e.target as HTMLElement;
    // Don't start dragging if clicking on interactive elements
    if (target.closest('button, a, input, select, [role="checkbox"], [role="menuitem"], .dropdown-menu, [role="dialog"]')) {
      return;
    }
    // Initialize drag state (but don't prevent default yet - wait for actual drag)
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    const rect = tableScrollRef.current.getBoundingClientRect();
    startXRef.current = e.pageX - rect.left;
    scrollLeftRef.current = tableScrollRef.current.scrollLeft;
  }, []);
  
  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    if (!tableScrollRef.current) return;
    // Only prevent click if we actually dragged
    if (hasDraggedRef.current) {
      // Prevent click event if we dragged
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    if (tableScrollRef.current) {
      tableScrollRef.current.style.cursor = 'grab';
    }
  }, []);
  
  // Handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    if (!tableScrollRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    hasDraggedRef.current = false;
    if (tableScrollRef.current) {
      tableScrollRef.current.style.cursor = 'grab';
    }
  }, []);
  
  // Global mouse handlers for drag scrolling (works even if mouse leaves the table)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tableScrollRef.current) return;
      
      // Check if we should start dragging (after mouse moved a bit)
      if (!isDraggingRef.current && startXRef.current !== 0) {
        const rect = tableScrollRef.current.getBoundingClientRect();
        const x = e.pageX - rect.left;
        const deltaX = Math.abs(x - startXRef.current);
        
        // Start dragging only if mouse moved more than 5 pixels (drag threshold)
        if (deltaX > 5) {
          isDraggingRef.current = true;
          setIsDragging(true);
          hasDraggedRef.current = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }
      
      // Perform scrolling if dragging
      if (isDraggingRef.current && tableScrollRef.current) {
        e.preventDefault();
        const rect = tableScrollRef.current.getBoundingClientRect();
        const x = e.pageX - rect.left;
        const walk = (x - startXRef.current) * 2; // Scroll speed multiplier
        tableScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
      }
    };
    
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current && tableScrollRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        tableScrollRef.current.style.cursor = 'grab';
      }
      startXRef.current = 0;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);
  
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

  // Helper function to merge recoveries with detection results (without applying filters)
  const mergeRecoveries = useCallback((syncedRecoveries: any[], detectedClaims: any[]) => {
    console.log('[Recoveries] mergeRecoveries called:', {
      syncedCount: syncedRecoveries?.length || 0,
      detectedCount: detectedClaims?.length || 0
    });
    
    // Transform detection results to match recovery format
    const detected = (detectedClaims || []).map(det => ({
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
    
    // Combine and sort (don't apply filters here - let filteredClaims handle that)
    const merged = [...detected, ...synced].sort((a, b) => {
      const dateA = new Date(a.discovery_date || a.created || a.created_at || 0).getTime();
      const dateB = new Date(b.discovery_date || b.created || b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    console.log('[Recoveries] mergeRecoveries result:', merged.length, 'items');
    setMergedRecoveries(merged);
  }, []);

  // Fetch detection statistics and urgent claims
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [statsRes, urgentRes] = await Promise.all([
        detectionApi.getDetectionStatistics().catch(() => ({ ok: false, data: null })),
        detectionApi.getClaimsApproachingDeadline({ days: 7 }).catch(() => ({ ok: false, data: null })),
      ]);
      if (!cancelled) {
        if (statsRes.ok && statsRes.data?.statistics) {
          setDetectionStats(statsRes.data.statistics);
        }
        if (urgentRes.ok && urgentRes.data) {
          setUrgentClaims(urgentRes.data.claims || []);
          setUrgentClaimsCount(urgentRes.data.count || 0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resData, metricsRes, amazonRecoveriesRes, detectionRes] = await Promise.all([
        recoveryApi.getRecoveries().catch(() => null),
        api.getRecoveriesMetrics(),
        api.getAmazonRecoveries().catch(() => null),
        detectionApi.getDetectionResults({ limit: 100, offset: 0 }).catch((err) => {
          console.warn('Failed to fetch detection results:', err);
          return { ok: false, data: null };
        }),
      ]);
      if (!cancelled) {
        console.log('[Recoveries] Data fetch results:', {
          resData: resData ? (Array.isArray(resData) ? `${resData.length} items` : 'not array') : 'null',
          detectionRes: detectionRes?.ok ? `${detectionRes.data?.results?.length || 0} results` : 'failed',
          currentClaimsLength: claims.length
        });

        if (resData && Array.isArray(resData)) {
          const newClaims = resData as any[];
          console.log('[Recoveries] Got recoveries from API:', newClaims.length);
          
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
            console.log('[Recoveries] Merging with detection results:', detectionRes.data.results.length);
            setDetectionResults(detectionRes.data.results);
            mergeRecoveries(newClaims, detectionRes.data.results);
          } else {
            // No detection results, but we have synced recoveries - merge with empty detection array
            console.log('[Recoveries] No detection results, merging recoveries only');
            setDetectionResults([]);
            mergeRecoveries(newClaims, []);
          }
        } else {
          // No synced recoveries from API - keep existing claims (might be mock data)
          console.log('[Recoveries] No API data, using existing claims:', claims.length);
          // Only merge if we have detection results
          if (detectionRes.ok && detectionRes.data?.results) {
            console.log('[Recoveries] Merging detection results with existing claims');
            setDetectionResults(detectionRes.data.results);
            // Merge detection results with existing claims (or empty if no claims)
            mergeRecoveries(claims.length > 0 ? claims : [], detectionRes.data.results);
          } else {
            // No detection results either - just ensure mergedRecoveries reflects current claims
            console.log('[Recoveries] No detection results, merging existing claims only');
            setDetectionResults([]);
            // If we have claims, merge them (even if empty detection), otherwise set empty
            if (claims.length > 0) {
              mergeRecoveries(claims, []);
            } else {
              console.warn('[Recoveries] No claims available at all!');
              mergeRecoveries([], []);
            }
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

  // Filter data based on search and filters - use mergedRecoveries if available
  const filteredClaims = useMemo(() => {
    // Use mergedRecoveries if it has data, otherwise fall back to claims
    // null means not initialized yet, so use claims
    // empty array means initialized but no data, so also use claims if available
    let sourceData: any[] = [];
    if (mergedRecoveries !== null) {
      // mergedRecoveries has been initialized
      if (mergedRecoveries.length > 0) {
        sourceData = mergedRecoveries;
      } else {
        // mergedRecoveries is empty, fall back to claims
        sourceData = (claims && claims.length > 0) ? claims : [];
      }
    } else {
      // mergedRecoveries not initialized yet, use claims
      sourceData = (claims && claims.length > 0) ? claims : [];
    }
    
    // Debug logging
    console.log('[Recoveries] Filtering data:', {
      sourceDataLength: sourceData.length,
      mergedRecoveries: mergedRecoveries !== null ? `${mergedRecoveries.length} items` : 'null',
      claimsLength: claims?.length || 0,
      filterSource,
      filterConfidence,
      loading
    });
    
    let filtered = sourceData.filter(claim => {
      // Source filter (Phase 3)
      if (filterSource !== 'all') {
        if (claim.source !== filterSource) return false;
      }
      
      // Confidence filter (Phase 3) - only for detected claims
      if (filterConfidence !== 'all' && filterSource === 'detected') {
        if (!claim.confidence_score) return false;
        if (filterConfidence === 'high' && claim.confidence_score < 0.85) return false;
        if (filterConfidence === 'medium' && (claim.confidence_score < 0.50 || claim.confidence_score >= 0.85)) return false;
        if (filterConfidence === 'low' && claim.confidence_score >= 0.50) return false;
      }
      
      // Search filter
      const searchMatch = !searchTerm || 
        claim.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const claimDate = new Date(claim.created || claim.discovery_date || claim.created_at || 0);
      const dateMatch = (!dateRange?.from || claimDate >= dateRange.from) && 
                       (!dateRange?.to || claimDate <= dateRange.to);
      
      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.type);
      
      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      
      return searchMatch && dateMatch && typeMatch && statusMatch;
    });

    return filtered;
  }, [mergedRecoveries, claims, filterSource, filterConfidence, searchTerm, dateRange, selectedClaimTypes, selectedStatuses]);

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
    
    // Calculate 30-day success rate from all claims (use mergedRecoveries if available)
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentClaims = dataSource.filter(claim => {
      const claimDate = new Date(claim.created || claim.discovery_date || claim.created_at || 0);
      return claimDate >= thirtyDaysAgo;
    });
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
  }, [filteredClaims, claims, mergedRecoveries]);

  // Owed top-line summary (non-paid)
  const owedSummary = useMemo(() => {
    // Prefer backend metrics when available
    if (metrics && (typeof (metrics as any).totalOwed === 'number' || typeof (metrics as any).owedTotal === 'number')) {
      const totalOwed = (metrics as any).totalOwed ?? (metrics as any).owedTotal;
      const openCount = (metrics as any).openCount ?? (metrics as any).openClaims ?? 0;
      return { totalOwed, openCount };
    }
    
    // Use mergedRecoveries (includes Agent 3 detections) if available, otherwise fall back to claims
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;
    const openStatuses = new Set(['New', 'Pending', 'Submitted']);
    const openClaims = dataSource.filter(c => openStatuses.has(c.status));
    const totalOwed = openClaims.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);
    return { totalOwed, openCount: openClaims.length };
  }, [claims, metrics, mergedRecoveries]);

  // Category breakdown chips
  const categoryCounts = useMemo(() => {
    // Prefer backend-provided category counts if available
    const fromMetrics = (metrics as any)?.categoryCounts || (metrics as any)?.categories;
    if (fromMetrics && typeof fromMetrics === 'object') {
      return fromMetrics as Record<string, number>;
    }
    // Use mergedRecoveries (includes Agent 3 detections) if available, otherwise fall back to claims
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;
    const counts: Record<string, number> = {
      'Lost Inventory': 0,
      'Damaged': 0,
      'Uncredited Returns': 0,
      'Overcharges': 0,
      'Misapplied Fees': 0,
    };
    for (const c of dataSource) {
      // Map Agent 3 anomaly types to categories
      const type = c.type || c.anomaly_type || '';
      if (type === 'Lost Inventory' || type === 'missing_unit') counts['Lost Inventory'] += 1;
      if (type === 'Damaged Goods' || type === 'damaged_stock') counts['Damaged'] += 1;
      if (type === 'Uncredited Return' || type === 'return_not_credited') counts['Uncredited Returns'] += 1;
      if (type === 'Overcharge' || type === 'Fee Dispute' || type === 'incorrect_fee' || type === 'overcharge' || type === 'duplicate_charge') counts['Overcharges'] += 1;
      if (type === 'Fee Dispute' || type === 'incorrect_fee') counts['Misapplied Fees'] += 1;
    }
    return counts;
  }, [claims, metrics, mergedRecoveries]);

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

        {/* Urgent Claims Banner - Phase 3 */}
        {urgentClaimsCount > 0 && (
          <Card className={`mb-6 border-2 ${
            urgentClaims.some(c => c.days_remaining <= 3)
              ? 'bg-red-500/10 border-red-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    urgentClaims.some(c => c.days_remaining <= 3)
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100 mb-1">
                      {urgentClaimsCount} Claim{urgentClaimsCount !== 1 ? 's' : ''} Expiring Soon
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">
                      {urgentClaims.some(c => c.days_remaining <= 3)
                        ? 'Some claims are expiring in less than 3 days. File them immediately to avoid missing the deadline.'
                        : 'These claims are approaching their 60-day Amazon deadline. Review and file them soon.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {urgentClaims.slice(0, 5).map((claim) => (
                        <div
                          key={claim.id}
                          className={`px-3 py-2 rounded-md border ${
                            claim.days_remaining <= 3
                              ? 'bg-red-500/20 border-red-500/30'
                              : 'bg-amber-500/20 border-amber-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className={`h-3 w-3 ${
                              claim.days_remaining <= 3 ? 'text-red-300' : 'text-amber-300'
                            }`} />
                            <span className="text-xs font-medium text-gray-200">
                              {claim.days_remaining} day{claim.days_remaining !== 1 ? 's' : ''} left
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-300">
                              {formatCurrency(claim.estimated_value)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs ml-2"
                              onClick={() => {
                                // Navigate to claim or open details
                                const foundClaim = mergedRecoveries?.find(c => c.id === claim.id) || 
                                                  claims.find(c => c.id === claim.id);
                                if (foundClaim) {
                                  window.location.href = `/recoveries/${claim.id}`;
                                }
                              }}
                            >
                              File Claim
                            </Button>
                          </div>
                        </div>
                      ))}
                      {urgentClaims.length > 5 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setFilterSource('detected');
                            // Scroll to table
                            setTimeout(() => {
                              document.querySelector('.recoveries-table-scroll')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          View All {urgentClaimsCount} Claims
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setUrgentClaimsCount(0)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Key Metrics Bar - Enhanced with Phase 3 Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Claims Found</p>
                  <p className="text-2xl font-bold text-gray-100">
                    {detectionStats?.total_anomalies ?? detectionStats?.totalDetections ?? (metrics ? metrics.totalClaimsFound : keyMetrics.totalClaimsFound)}
                    {amazonClaimCount != null && amazonClaimCount > 0 && (
                      <span className="text-sm text-emerald-400 ml-2 font-normal">
                        ({amazonClaimCount} from Amazon)
                      </span>
                    )}
                  </p>
                  {detectionStats?.total_anomalies && (
                    <p className="text-xs text-gray-400 mt-1">
                      {detectionStats.by_confidence?.high || 0} high confidence
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {detectionStats?.total_value ? 'Total Recovery Value' : 'Value in Progress'}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(
                      detectionStats?.total_value ?? 
                      (metrics ? metrics.valueInProgress : keyMetrics.valueInProgress)
                    )}
                  </p>
                  {detectionStats?.expiring_soon !== undefined && detectionStats.expiring_soon > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      {detectionStats.expiring_soon} expiring soon
                    </p>
                  )}
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
                  {detectionStats?.expired_count !== undefined && detectionStats.expired_count > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      {detectionStats.expired_count} expired
                    </p>
                  )}
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
                  {detectionStats?.by_confidence && (
                    <p className="text-xs text-gray-400 mt-1">
                      {detectionStats.by_confidence.medium + detectionStats.by_confidence.low} medium/low
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase 3: Detection Statistics Breakdown */}
        {detectionStats && (detectionStats.by_severity || detectionStats.by_type) && (
          <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Detection Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Severity */}
                {detectionStats.by_severity && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">By Severity</h4>
                    <div className="space-y-2">
                      {Object.entries(detectionStats.by_severity).map(([severity, data]: [string, any]) => (
                        <div key={severity} className="flex items-center justify-between p-2 rounded bg-white/5">
                          <div className="flex items-center gap-2">
                            <Badge className={
                              severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                              severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-gray-500/20 text-gray-300 border-gray-500/30'
                            }>
                              {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-300">{data.count} claims</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-100">
                            {formatCurrency(data.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* By Type */}
                {detectionStats.by_type && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">By Anomaly Type</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(detectionStats.by_type).slice(0, 5).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-2 rounded bg-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300 capitalize">
                              {type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-400">({data.count})</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-100">
                            {formatCurrency(data.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 stroke-[2]" />
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
        <Card className="bg-white/5 border-white/10 text-gray-300 w-full overflow-hidden">
          <CardContent className="p-0 w-full">
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Loading recoveries...</div>
            )}
            {error && (
              <div className="p-4 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && rankedClaims.length === 0 && (
              <div className="p-4 text-sm text-gray-400">
                No recoveries found. {((mergedRecoveries === null || (mergedRecoveries && mergedRecoveries.length === 0)) && (!claims || claims.length === 0))
                  ? 'Try syncing your Amazon account or running the detector.' 
                  : 'Try adjusting your filters.'}
              </div>
            )}
            {!loading && rankedClaims.length > 0 && (
            <div 
              ref={tableScrollRef}
              className="w-full overflow-x-auto overflow-y-visible recoveries-table-scroll" 
              style={{ 
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                maxWidth: '100%',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
            >
            <Table style={{ minWidth: '1600px', width: 'max-content' }}>
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
                          {/* Phase 3: Status Update - only for detected claims */}
                          {claim.source === 'detected' && claim.status !== 'resolved' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedDetection(claim);
                              setSelectedStatus(claim.status || 'pending');
                              setStatusUpdateNotes('');
                              setStatusUpdateModalOpen(true);
                            }}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                          )}
                          {/* Phase 3: Resolve Detection - only for detected claims */}
                          {claim.source === 'detected' && claim.status !== 'resolved' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedDetection(claim);
                              setResolveNotes('');
                              setResolveAmount(claim.guaranteedAmount?.toString() || '');
                              setResolveModalOpen(true);
                            }}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Resolved
                            </DropdownMenuItem>
                          )}
                          {/* Phase 3: View Details - open modal for detected claims, navigate for synced */}
                          {claim.source === 'detected' ? (
                            <DropdownMenuItem onClick={() => {
                              setDetectionDetails(claim);
                              setDetailsModalOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem asChild>
                              <Link to={`/recoveries/${claim.id}`} state={{ claim }} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {claim.source !== 'detected' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/recoveries/${encodeURIComponent(claim.id)}/resolve`} state={{ claim }} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Resolve Case
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-blue-400 focus:text-blue-300 focus:bg-blue-400/10" onClick={async () => {
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
            </div>
            )}
          </CardContent>
        </Card>

        {/* Phase 3: Resolve Detection Modal */}
        <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
          <DialogContent className="bg-[#0B1220] border-white/10 text-gray-300">
            <DialogHeader>
              <DialogTitle>Mark Detection as Resolved</DialogTitle>
              <DialogDescription className="text-gray-400">
                Mark this detection as resolved and record the resolution details.
              </DialogDescription>
            </DialogHeader>
            {selectedDetection && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Detection ID</Label>
                  <p className="text-sm text-gray-400 font-mono">{selectedDetection.id}</p>
                </div>
                <div>
                  <Label className="text-gray-300">Anomaly Type</Label>
                  <p className="text-sm text-gray-400 capitalize">
                    {selectedDetection.type?.replace(/_/g, ' ') || selectedDetection.anomaly_type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="resolve-amount" className="text-gray-300">Resolution Amount</Label>
                  <Input
                    id="resolve-amount"
                    type="number"
                    step="0.01"
                    value={resolveAmount}
                    onChange={(e) => setResolveAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10 text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="resolve-notes" className="text-gray-300">Notes</Label>
                  <Textarea
                    id="resolve-notes"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Enter resolution notes (e.g., 'Resolved via Amazon reimbursement')"
                    className="bg-white/5 border-white/10 text-gray-100 min-h-[100px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResolveModalOpen(false);
                  setSelectedDetection(null);
                  setResolveNotes('');
                  setResolveAmount('');
                }}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDetection) return;
                  try {
                    const res = await detectionApi.resolveDetection(selectedDetection.id, {
                      notes: resolveNotes,
                      resolution_amount: resolveAmount ? parseFloat(resolveAmount) : undefined,
                    });
                    if (res.ok) {
                      toast({
                        title: 'Detection Resolved',
                        description: res.data?.message || 'Detection marked as resolved successfully.',
                      });
                      // Update the detection in state
                      setDetectionResults(prev => prev.map(d => 
                        d.id === selectedDetection.id ? { ...d, status: 'resolved' } : d
                      ));
                      setMergedRecoveries(prev => prev?.map(c => 
                        c.id === selectedDetection.id ? { ...c, status: 'resolved' } : c
                      ));
                      setResolveModalOpen(false);
                      setSelectedDetection(null);
                      setResolveNotes('');
                      setResolveAmount('');
                      // Refresh statistics
                      const statsRes = await detectionApi.getDetectionStatistics();
                      if (statsRes.ok && statsRes.data?.statistics) {
                        setDetectionStats(statsRes.data.statistics);
                      }
                    } else {
                      toast({
                        title: 'Failed to Resolve',
                        description: res.error || 'Please try again.',
                        variant: 'destructive',
                      });
                    }
                  } catch (e: any) {
                    toast({
                      title: 'Error',
                      description: e?.message || 'Failed to resolve detection.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-white"
              >
                Mark as Resolved
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phase 3: Status Update Modal */}
        <Dialog open={statusUpdateModalOpen} onOpenChange={setStatusUpdateModalOpen}>
          <DialogContent className="bg-[#0B1220] border-white/10 text-gray-300">
            <DialogHeader>
              <DialogTitle>Update Detection Status</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the status of this detection through the workflow: Pending → Reviewed → Disputed → Resolved
              </DialogDescription>
            </DialogHeader>
            {selectedDetection && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Detection ID</Label>
                  <p className="text-sm text-gray-400 font-mono">{selectedDetection.id}</p>
                </div>
                <div>
                  <Label htmlFor="status-select" className="text-gray-300">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status-select" className="bg-white/5 border-white/10 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-notes" className="text-gray-300">Notes</Label>
                  <Textarea
                    id="status-notes"
                    value={statusUpdateNotes}
                    onChange={(e) => setStatusUpdateNotes(e.target.value)}
                    placeholder="Enter notes for this status change (e.g., 'Reviewed and verified')"
                    className="bg-white/5 border-white/10 text-gray-100 min-h-[100px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setStatusUpdateModalOpen(false);
                  setSelectedDetection(null);
                  setStatusUpdateNotes('');
                  setSelectedStatus('pending');
                }}
                className="border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDetection) return;
                  try {
                    const res = await detectionApi.updateDetectionStatus(selectedDetection.id, {
                      status: selectedStatus,
                      notes: statusUpdateNotes,
                    });
                    if (res.ok) {
                      toast({
                        title: 'Status Updated',
                        description: res.data?.message || 'Detection status updated successfully.',
                      });
                      // Update the detection in state
                      setDetectionResults(prev => prev.map(d => 
                        d.id === selectedDetection.id ? { ...d, status: selectedStatus } : d
                      ));
                      setMergedRecoveries(prev => prev?.map(c => 
                        c.id === selectedDetection.id ? { ...c, status: selectedStatus } : c
                      ));
                      setStatusUpdateModalOpen(false);
                      setSelectedDetection(null);
                      setStatusUpdateNotes('');
                      setSelectedStatus('pending');
                    } else {
                      toast({
                        title: 'Failed to Update Status',
                        description: res.error || 'Please try again.',
                        variant: 'destructive',
                      });
                    }
                  } catch (e: any) {
                    toast({
                      title: 'Error',
                      description: e?.message || 'Failed to update status.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Phase 3: Detection Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="bg-[#0B1220] border-white/10 text-gray-300 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detection Details</DialogTitle>
              <DialogDescription className="text-gray-400">
                Complete information about this detected anomaly
              </DialogDescription>
            </DialogHeader>
            {detectionDetails && (
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Detection ID</Label>
                    <p className="text-sm text-gray-400 font-mono mt-1">{detectionDetails.id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Sync ID</Label>
                    <p className="text-sm text-gray-400 font-mono mt-1">{detectionDetails.sync_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Anomaly Type</Label>
                    <p className="text-sm text-gray-300 capitalize mt-1">
                      {detectionDetails.type?.replace(/_/g, ' ') || detectionDetails.anomaly_type?.replace(/_/g, ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Severity</Label>
                    <Badge className={`mt-1 ${
                      detectionDetails.severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      detectionDetails.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    }`}>
                      {detectionDetails.severity?.charAt(0).toUpperCase() + detectionDetails.severity?.slice(1) || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-300">Status</Label>
                    <Badge className={cn('mt-1', getStatusColor(detectionDetails.status))}>
                      {detectionDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-300">Confidence Score</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {detectionDetails.confidence_score !== null && detectionDetails.confidence_score !== undefined ? (
                        <>
                          <span className="text-sm font-semibold text-gray-300">
                            {(detectionDetails.confidence_score * 100).toFixed(1)}%
                          </span>
                          <Badge className={
                            detectionDetails.confidence_score >= 0.85 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            detectionDetails.confidence_score >= 0.50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }>
                            {detectionDetails.confidence_score >= 0.85 ? 'High' : detectionDetails.confidence_score >= 0.50 ? 'Medium' : 'Low'}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold text-gray-200 mb-3">Financial Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Estimated Value</Label>
                      <p className="text-lg font-semibold text-emerald-400 mt-1">
                        {formatCurrency(detectionDetails.estimated_value || detectionDetails.guaranteedAmount || 0, detectionDetails.currency || 'USD')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Currency</Label>
                      <p className="text-sm text-gray-300 mt-1">{detectionDetails.currency || 'USD'}</p>
                    </div>
                  </div>
                </div>

                {/* Dates & Deadlines */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold text-gray-200 mb-3">Dates & Deadlines</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Discovery Date</Label>
                      <p className="text-sm text-gray-300 mt-1">
                        {detectionDetails.discovery_date 
                          ? format(new Date(detectionDetails.discovery_date), 'MMM dd, yyyy HH:mm')
                          : detectionDetails.created 
                          ? format(new Date(detectionDetails.created), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Deadline Date</Label>
                      <p className={`text-sm font-semibold mt-1 ${
                        detectionDetails.days_remaining !== undefined && detectionDetails.days_remaining <= 7
                          ? 'text-amber-400'
                          : 'text-gray-300'
                      }`}>
                        {detectionDetails.deadline_date 
                          ? format(new Date(detectionDetails.deadline_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    {detectionDetails.days_remaining !== undefined && (
                      <div>
                        <Label className="text-gray-300">Days Remaining</Label>
                        <p className={`text-sm font-semibold mt-1 ${
                          detectionDetails.days_remaining <= 3 ? 'text-red-400' :
                          detectionDetails.days_remaining <= 7 ? 'text-amber-400' :
                          'text-gray-300'
                        }`}>
                          {detectionDetails.days_remaining} day{detectionDetails.days_remaining !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-300">Created At</Label>
                      <p className="text-sm text-gray-300 mt-1">
                        {detectionDetails.created_at 
                          ? format(new Date(detectionDetails.created_at), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence */}
                {detectionDetails.evidence && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Evidence</h4>
                    <div className="bg-white/5 border border-white/10 rounded-md p-4">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(detectionDetails.evidence, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Related Event IDs */}
                {detectionDetails.related_event_ids && detectionDetails.related_event_ids.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Related Event IDs</h4>
                    <div className="flex flex-wrap gap-2">
                      {detectionDetails.related_event_ids.map((eventId: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="font-mono text-xs">
                          {eventId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Information */}
                {(detectionDetails.sku || detectionDetails.asin) && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Product Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {detectionDetails.sku && (
                        <div>
                          <Label className="text-gray-300">SKU</Label>
                          <p className="text-sm text-gray-300 font-mono mt-1">{detectionDetails.sku}</p>
                        </div>
                      )}
                      {detectionDetails.asin && (
                        <div>
                          <Label className="text-gray-300">ASIN</Label>
                          <p className="text-sm text-gray-300 font-mono mt-1">{detectionDetails.asin}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Details/Description */}
                {detectionDetails.details && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3">Description</h4>
                    <p className="text-sm text-gray-300">{detectionDetails.details}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDetailsModalOpen(false);
                  setDetectionDetails(null);
                }}
                className="border-white/10"
              >
                Close
              </Button>
              {detectionDetails && (
                <>
                  {detectionDetails.status !== 'resolved' && (
                    <Button
                      onClick={() => {
                        setDetailsModalOpen(false);
                        setSelectedDetection(detectionDetails);
                        setSelectedStatus(detectionDetails.status || 'pending');
                        setStatusUpdateModalOpen(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-400 text-white"
                    >
                      Update Status
                    </Button>
                  )}
                  {detectionDetails.status !== 'resolved' && (
                    <Button
                      onClick={() => {
                        setDetailsModalOpen(false);
                        setSelectedDetection(detectionDetails);
                        setResolveNotes('');
                        setResolveAmount((detectionDetails.estimated_value || detectionDetails.guaranteedAmount || 0).toString());
                        setResolveModalOpen(true);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white"
                    >
                      Mark as Resolved
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}