import React, { useEffect, useState, useRef, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { startSync, getSyncStatus, cancelSync, forceClearSync, subscribeSyncProgress, type SyncStatusResponse } from '@/lib/inventoryApi';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { RefreshCw, XCircle, CheckCircle2, AlertCircle, Loader2, Search, Package, Truck, RotateCcw, DollarSign, Archive, Target, Clock, ChevronDown, ChevronUp, ChevronRight, ExternalLink, Download } from 'lucide-react';
const GmailIcon = '/G.png';
const OutlookIcon = '/outlookicon.webp';
const GoogleDriveIcon = '/gd.png';
const DropboxIcon = '/Dropbox_Icon.svg.png';
import { useToast } from '@/hooks/use-toast';
import { useDetectionUpdates } from '@/hooks/use-detection-updates';
import { api } from '@/lib/api';

// Log entry type
interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress' | 'thinking';
  category: 'orders' | 'inventory' | 'shipments' | 'returns' | 'settlements' | 'fees' | 'claims' | 'detection' | 'system';
  message: string;
  count?: number;
  context?: {
    details?: string[];
    estimatedTime?: string;
  };
}

// Data type tracking
interface DataTypeStatus {
  orders: { syncing: boolean; completed: boolean; count: number };
  inventory: { syncing: boolean; completed: boolean; count: number };
  shipments: { syncing: boolean; completed: boolean; count: number };
  returns: { syncing: boolean; completed: boolean; count: number };
  settlements: { syncing: boolean; completed: boolean; count: number };
  fees: { syncing: boolean; completed: boolean; count: number };
  claims: { syncing: boolean; completed: boolean; count: number };
}

// Log story group - aggregates related logs into collapsible sections
interface LogStory {
  id: string;
  category: string;
  title: string;           // "Inventory Scan Complete"
  summary: string;         // "75 active SKUs, 3 anomalies found"
  potentialValue?: number; // $145 potential
  anomaliesFound?: number; // 3 issues
  itemCount?: number;      // 75 items
  isCompleted: boolean;
  logs: LogEntry[];        // Detailed logs inside
  linkTo?: string;         // Navigation link
}

// Category icons
const getCategoryIcon = (category: LogEntry['category']) => {
  switch (category) {
    case 'orders': return <Package className="h-3.5 w-3.5" />;
    case 'inventory': return <Archive className="h-3.5 w-3.5" />;
    case 'shipments': return <Truck className="h-3.5 w-3.5" />;
    case 'returns': return <RotateCcw className="h-3.5 w-3.5" />;
    case 'settlements': return <DollarSign className="h-3.5 w-3.5" />;
    case 'fees': return <DollarSign className="h-3.5 w-3.5" />;
    case 'claims': return <Target className="h-3.5 w-3.5" />;
    case 'detection': return <Target className="h-3.5 w-3.5" />;
    case 'system': return <Clock className="h-3.5 w-3.5" />;
  }
};

// Format timestamp like Render logs
const formatTimestamp = (date: Date) => {
  return date.toISOString().replace('T', ' ').slice(0, 23);
};

export default function Sync() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  // Tenant priority: URL param > context > fallback
  const currentTenantSlug = urlTenantSlug || tenant?.slug || 'default';
  const urlSyncId = params.get('id') || undefined;
  const [syncId, setSyncId] = useState<string | undefined>(urlSyncId);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [message, setMessage] = useState<string>('Initializing sync...');
  const [syncData, setSyncData] = useState<SyncStatusResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncBlocked, setIsSyncBlocked] = useState(false); // Shows force-clear button
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const previousStatusRef = useRef<'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled'>('idle');
  const toastShownRef = useRef<{ started?: boolean; completed?: boolean; failed?: boolean; cancelled?: boolean }>({});
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const sourcesModalTimeoutRef = useRef<number | null>(null);
  const modalDismissedRef = useRef<boolean>(false); // Track if user dismissed modal for this sync session
  const [providerLoading, setProviderLoading] = useState<'gmail' | 'outlook' | 'gdrive' | 'dropbox' | null>(null);

  // Log system state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'money' | 'issues'>('all'); // Filter: All / Money / Issues
  const [healthExpanded, setHealthExpanded] = useState(false); // Toggle health details dropdown
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set()); // Track expanded story groups
  const [logsFinished, setLogsFinished] = useState(false); // Track when all queued logs have been displayed
  const logsFinishedRef = useRef(false); // Ref version for async function
  const logContainerRef = useRef<HTMLDivElement>(null);
  const logQueueRef = useRef<Array<{ entry: Omit<LogEntry, 'id' | 'timestamp'>; delay: number }>>([]);
  const isProcessingQueueRef = useRef(false);
  const completionLogsAddedRef = useRef(false); // Track if completion logs have been queued
  const previousDataRef = useRef<DataTypeStatus>({
    orders: { syncing: false, completed: false, count: 0 },
    inventory: { syncing: false, completed: false, count: 0 },
    shipments: { syncing: false, completed: false, count: 0 },
    returns: { syncing: false, completed: false, count: 0 },
    settlements: { syncing: false, completed: false, count: 0 },
    fees: { syncing: false, completed: false, count: 0 },
    claims: { syncing: false, completed: false, count: 0 },
  });

  // Add a log entry immediately
  const addLogImmediate = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setLogs(prev => [...prev, newEntry]);
  };

  // Process the log queue with delays
  const processLogQueue = async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (logQueueRef.current.length > 0) {
      const item = logQueueRef.current.shift();
      if (item) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
        addLogImmediate(item.entry);
      }
    }

    isProcessingQueueRef.current = false;

    // If completion logs were added and queue is now empty, mark logs as finished
    // Use ref to check if already finished (avoids stale closure)
    if (completionLogsAddedRef.current && !logsFinishedRef.current) {
      // Wait a moment to ensure no more logs are being added
      await new Promise(resolve => setTimeout(resolve, 300));
      // Double check queue is still empty
      if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
        logsFinishedRef.current = true;
        setLogsFinished(true);
      } else if (logQueueRef.current.length > 0) {
        // More logs were added, process them
        processLogQueue();
      }
    }
  };

  // Track last log for deduplication
  const lastLogRef = useRef<{ message: string; time: number } | null>(null);

  // Add a log entry with optional delay (queued)
  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>, delayMs: number = 0) => {
    // Deduplication: Ignore identical messages received within 2000ms
    const now = Date.now();
    if (lastLogRef.current &&
      lastLogRef.current.message === entry.message &&
      now - lastLogRef.current.time < 2000) {
      // console.log('Duplicate log ignored:', entry.message);
      return;
    }
    lastLogRef.current = { message: entry.message, time: now };

    if (delayMs === 0 && logQueueRef.current.length === 0) {
      // No delay and queue is empty, add immediately
      addLogImmediate(entry);
    } else {
      // Queue the log with delay
      const baseDelay = entry.type === 'thinking' ? 800 : 400; // thinking logs appear slower
      logQueueRef.current.push({ entry, delay: delayMs || baseDelay });
      processLogQueue();
    }
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Set progress to 100% when logs finish
  useEffect(() => {
    if (logsFinished && status === 'completed') {
      setProgress(100);
    }
  }, [logsFinished, status]);



  // Filter logs based on search AND category filter
  const filteredLogs = useMemo(() => {
    // First apply category filter
    let filtered = logs;

    if (logFilter === 'money') {
      // Money events: claims, reimbursements, discrepancies, potential value
      const moneyKeywords = ['claim', 'reimburse', 'recovery', 'discrepanc', 'mismatch', 'potential', 'value', 'amount', '$', 'fee', 'overcharge', 'refund', 'payout', 'anomal'];
      filtered = logs.filter(log => {
        const lowerMsg = log.message.toLowerCase();
        return moneyKeywords.some(k => lowerMsg.includes(k)) ||
          log.category === 'claims' ||
          log.type === 'success';
      });
    } else if (logFilter === 'issues') {
      // Issues: only actual errors and warnings by log type
      // NOT info logs that just mention the word "error" in context
      filtered = logs.filter(log =>
        log.type === 'error' ||
        log.type === 'warning'
      );
    }
    // 'all' keeps all logs

    // Then apply search filter
    if (!logSearch.trim()) return filtered;
    const searchLower = logSearch.toLowerCase();
    return filtered.filter(log =>
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  }, [logs, logSearch, logFilter]);

  // Group logs into collapsible story sections
  const logStories = useMemo((): LogStory[] => {
    const storyMap: Record<string, LogStory> = {};

    // Define story configurations
    const storyConfig: Record<string, { title: string; linkTo?: string }> = {
      'inventory': { title: 'Inventory Scan', linkTo: '/recoveries' },
      'orders': { title: 'Order Ledger Check', linkTo: '/recoveries' },
      'shipments': { title: 'Shipment Verification', linkTo: '/recoveries' },
      'returns': { title: 'Returns Analysis', linkTo: '/recoveries' },
      'settlements': { title: 'Settlement Reconciliation', linkTo: '/upcoming-payments' },
      'fees': { title: 'Fee Audit', linkTo: '/recoveries' },
      'claims': { title: 'Claim Detection', linkTo: '/recoveries' },
      'detection': { title: 'Opportunity Detection', linkTo: '/recoveries' },
      'system': { title: 'System', linkTo: undefined },
    };

    // Group filtered logs by category
    for (const log of filteredLogs) {
      const category = log.category || 'system';

      if (!storyMap[category]) {
        const config = storyConfig[category] || { title: category, linkTo: undefined };
        storyMap[category] = {
          id: `story_${category}`,
          category,
          title: config.title,
          summary: '',
          isCompleted: false,
          logs: [],
          linkTo: config.linkTo,
          itemCount: 0,
          anomaliesFound: 0,
          potentialValue: 0,
        };
      }

      storyMap[category].logs.push(log);

      // Extract counts from log messages
      const countMatch = log.message.match(/(\d+)\s+(orders?|SKUs?|shipments?|returns?|settlements?|periods?|claims?|records?)/i);
      if (countMatch) {
        storyMap[category].itemCount = parseInt(countMatch[1], 10);
      }

      // Extract anomalies/issues from messages
      const anomalyMatch = log.message.match(/(\d+)\s+(anomal|issue|mismatch|suspicious|discrepanc|opportunit)/i);
      if (anomalyMatch) {
        storyMap[category].anomaliesFound = (storyMap[category].anomaliesFound || 0) + parseInt(anomalyMatch[1], 10);
      }

      // Extract money values from messages
      const moneyMatch = log.message.match(/\$([0-9,]+(?:\.\d{2})?)/);
      if (moneyMatch) {
        const value = parseFloat(moneyMatch[1].replace(/,/g, ''));
        if (!isNaN(value) && value > (storyMap[category].potentialValue || 0)) {
          storyMap[category].potentialValue = value;
        }
      }

      // Mark as completed if success/complete messages
      if (log.type === 'success' || log.message.toLowerCase().includes('complete')) {
        storyMap[category].isCompleted = true;
      }
    }

    // Build enhanced summaries for each story with money context
    for (const story of Object.values(storyMap)) {
      // Special handling for detection - use plain language
      if (story.category === 'detection' && story.anomaliesFound && story.anomaliesFound > 0) {
        const value = story.potentialValue || 0;
        const issues = story.anomaliesFound;

        // Calculate duration from first to last log
        const firstLog = story.logs[0]?.timestamp;
        const lastLog = story.logs[story.logs.length - 1]?.timestamp;
        const durationSec = firstLog && lastLog
          ? Math.round((lastLog.getTime() - firstLog.getTime()) / 1000)
          : null;

        const durationText = durationSec !== null ? ` • Completed in ${durationSec}s` : '';
        story.summary = `We found ${issues} issues worth $${value.toLocaleString()}${durationText}`;
        continue;
      }

      const parts: string[] = [];

      // Category-specific item labels
      const itemLabels: Record<string, string> = {
        'inventory': 'SKUs',
        'orders': 'orders',
        'shipments': 'shipments',
        'returns': 'returns',
        'settlements': 'periods',
        'fees': 'fees',
        'claims': 'claims',
        'detection': 'opportunities',
        'system': 'events',
      };

      const label = itemLabels[story.category] || 'items';

      if (story.itemCount && story.itemCount > 0) {
        parts.push(`${story.itemCount} ${label} checked`);
      }

      // Add anomalies if found
      if (story.anomaliesFound && story.anomaliesFound > 0) {
        parts.push(`${story.anomaliesFound} issues found`);
      }

      // Add potential value inline in summary if present
      if (story.potentialValue && story.potentialValue > 0) {
        parts.push(`— +$${story.potentialValue.toLocaleString()} potential`);
      }

      story.summary = parts.length > 0 ? parts.join(' — ') : `${story.logs.length} events`;
    }

    // Sort stories: system first, then by first log timestamp
    return Object.values(storyMap).sort((a, b) => {
      if (a.category === 'system') return -1;
      if (b.category === 'system') return 1;
      const aTime = a.logs[0]?.timestamp.getTime() || 0;
      const bTime = b.logs[0]?.timestamp.getTime() || 0;
      return aTime - bTime;
    });
  }, [filteredLogs]);

  // Health summary - group 64 detection types into 5 simple system groups
  const healthGroups = useMemo(() => {
    // Map categories to health groups
    const groupMapping: Record<string, string> = {
      // Data group: auth, tokens, API health
      'system': 'Data',
      'detection': 'Data',
      // Inventory group
      'inventory': 'Inventory',
      // Shipments group
      'shipments': 'Shipments',
      'orders': 'Shipments',
      // Returns group
      'returns': 'Returns',
      // Billing group
      'settlements': 'Billing',
      'fees': 'Billing',
      'claims': 'Billing',
    };

    const groups: Record<string, {
      name: string;
      status: 'ok' | 'warning' | 'error';
      issues: string[];
      categories: string[];
    }> = {
      'Data': { name: 'Data', status: 'ok', issues: [], categories: ['system', 'detection'] },
      'Inventory': { name: 'Inventory', status: 'ok', issues: [], categories: ['inventory'] },
      'Shipments': { name: 'Shipments', status: 'ok', issues: [], categories: ['shipments', 'orders'] },
      'Returns': { name: 'Returns', status: 'ok', issues: [], categories: ['returns'] },
      'Billing': { name: 'Billing', status: 'ok', issues: [], categories: ['settlements', 'fees', 'claims'] },
    };

    // Analyze logs to determine status for each group
    for (const log of logs) {
      const groupName = groupMapping[log.category] || 'Data';
      const group = groups[groupName];
      if (!group) continue;

      if (log.type === 'error') {
        group.status = 'error';
        // Extract a short description of the issue
        const shortIssue = log.message.length > 60 ? log.message.slice(0, 60) + '...' : log.message;
        if (!group.issues.includes(shortIssue)) {
          group.issues.push(shortIssue);
        }
      } else if (log.type === 'warning' && group.status !== 'error') {
        group.status = 'warning';
        const shortIssue = log.message.length > 60 ? log.message.slice(0, 60) + '...' : log.message;
        if (!group.issues.includes(shortIssue)) {
          group.issues.push(shortIssue);
        }
      }
    }

    return Object.values(groups);
  }, [logs]);

  // Get the most important issue to surface below the strip
  const surfacedIssue = useMemo(() => {
    const errorGroup = healthGroups.find(g => g.status === 'error');
    if (errorGroup && errorGroup.issues.length > 0) {
      return { type: 'error' as const, message: errorGroup.issues[0], group: errorGroup.name };
    }
    const warningGroup = healthGroups.find(g => g.status === 'warning');
    if (warningGroup && warningGroup.issues.length > 0) {
      return { type: 'warning' as const, message: warningGroup.issues[0], group: warningGroup.name };
    }
    return null;
  }, [healthGroups]);

  // Toggle story expansion
  const toggleStory = (storyId: string) => {
    setExpandedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  // Transform technical errors into human-friendly messages
  // Format: [TAG] What happened — What's next — Action needed (or "No action required")
  const humanizeErrorMessage = (message: string, type: LogEntry['type']): { text: string; isHumanized: boolean } => {
    // Only process error/warning messages
    if (type !== 'error' && type !== 'warning') {
      return { text: message, isHumanized: false };
    }

    const lowerMsg = message.toLowerCase();

    // API Rate Limits
    if (lowerMsg.includes('rate limit') || lowerMsg.includes('throttl') || lowerMsg.includes('too many requests') || lowerMsg.includes('429')) {
      return {
        text: '[AUTO-RETRY] Amazon API limit reached — We\'ll automatically retry in 15 minutes. No action required from you.',
        isHumanized: true
      };
    }

    // Authentication / Permission Issues
    if (lowerMsg.includes('unauthorized') || lowerMsg.includes('401') || lowerMsg.includes('forbidden') || lowerMsg.includes('403') || lowerMsg.includes('permission')) {
      return {
        text: '[PERMISSION NEEDED] We couldn\'t access some data — Your Amazon connection may need to be refreshed. Click "Reconnect Amazon" in Settings if this persists.',
        isHumanized: true
      };
    }

    // Connection / Network Issues
    if (lowerMsg.includes('timeout') || lowerMsg.includes('econnrefused') || lowerMsg.includes('network') || lowerMsg.includes('connection refused') || lowerMsg.includes('fetch failed')) {
      return {
        text: '[CONNECTION ISSUE] Temporary network hiccup — We\'ll automatically retry. If this keeps happening, check your internet connection.',
        isHumanized: true
      };
    }

    // Database / Duplicate Issues
    if (lowerMsg.includes('duplicate') || lowerMsg.includes('unique constraint') || lowerMsg.includes('already exists')) {
      return {
        text: '[SKIPPED] This data was already synced — No action needed, we\'re continuing with new items.',
        isHumanized: true
      };
    }

    // Not Found / Missing Data
    if (lowerMsg.includes('not found') || lowerMsg.includes('404') || lowerMsg.includes('no data') || lowerMsg.includes('empty response')) {
      return {
        text: '[NO DATA] No new data found for this period — This is normal if your account is new or data hasn\'t changed recently.',
        isHumanized: true
      };
    }

    // Server Errors
    if (lowerMsg.includes('500') || lowerMsg.includes('502') || lowerMsg.includes('503') || lowerMsg.includes('internal server error') || lowerMsg.includes('service unavailable')) {
      return {
        text: '[TEMPORARY ISSUE] Amazon\'s servers are busy right now — We\'ll retry automatically. No action required.',
        isHumanized: true
      };
    }

    // Validation Errors
    if (lowerMsg.includes('validation') || lowerMsg.includes('invalid') || lowerMsg.includes('malformed')) {
      return {
        text: '[DATA ISSUE] Some data couldn\'t be processed — We\'ve skipped it and continued. Our team has been notified.',
        isHumanized: true
      };
    }

    // Analysis / Detection Interruption
    if (lowerMsg.includes('analysis interrupted') || lowerMsg.includes('detection failed')) {
      return {
        text: '[PARTIAL ANALYSIS] Analysis was interrupted — We saved what we found so far. You can run another sync to complete.',
        isHumanized: true
      };
    }

    // Expired / Deadline Issues
    if (lowerMsg.includes('expired') || lowerMsg.includes('deadline') || lowerMsg.includes('past due')) {
      return {
        text: '[TIME SENSITIVE] Some claims may have passed their deadline — Check the Recoveries page for urgent items.',
        isHumanized: true
      };
    }

    // Generic fallback for any other error
    if (type === 'error') {
      return {
        text: `[NOTICED] Something unexpected happened — We're handling it automatically. If issues persist, try running sync again. Details: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`,
        isHumanized: true
      };
    }

    // Generic warning fallback
    if (type === 'warning') {
      return {
        text: `[HEADS UP] ${message.slice(0, 150)}${message.length > 150 ? '...' : ''} — Usually resolves on its own.`,
        isHumanized: true
      };
    }

    return { text: message, isHumanized: false };
  };

  // Selective log enrichment - add money hints to key lines only
  // NOTE: Only uses REAL data from story.potentialValue - no fake estimates
  const enrichLogMessage = (message: string, story: LogStory): { text: string; hint?: string } => {
    const lowerMsg = message.toLowerCase();

    // Keywords that deserve money hints (only if we have real data)
    const moneyKeywords = ['discrepanc', 'mismatch', 'suspicious', 'anomal', 'overcharge', 'missing', 'lost', 'damaged'];
    const reviewKeywords = ['flagged', 'escalated', 'detected', 'found issue', 'claim'];

    // Check for money-hint-worthy messages
    for (const keyword of moneyKeywords) {
      if (lowerMsg.includes(keyword)) {
        // ONLY use real potential value from story if available - no fake estimates
        if (story.potentialValue && story.potentialValue > 0) {
          return {
            text: message,
            hint: `+$${story.potentialValue.toLocaleString()} potential`
          };
        }
        // No fake dollar amounts - just flag for review
        return {
          text: message,
          hint: `flagged for claim review`
        };
      }
    }

    // Check for review-worthy messages (no money, just flag)
    for (const keyword of reviewKeywords) {
      if (lowerMsg.includes(keyword)) {
        return {
          text: message,
          hint: `flagged for claim review`
        };
      }
    }

    // No enrichment needed
    return { text: message };
  };

  // Update logs based on sync data changes - machine dialogue style with thinking and delays
  // Update logs based on sync data changes - now using real backend SSE events instead of mock dialogue
  const updateLogsFromSyncData = (data: SyncStatusResponse) => {
    const prev = previousDataRef.current;

    // Only track counts/state, NOT logs - all logs come from backend SSE events
    if (data.ordersProcessed && data.ordersProcessed > 0) {
      prev.orders.count = data.ordersProcessed;
      prev.orders.completed = data.ordersProcessed >= (data.totalOrders || data.ordersProcessed);
    }

    if (data.inventoryCount && data.inventoryCount > 0) {
      prev.inventory.count = data.inventoryCount;
      prev.inventory.completed = true;
    }

    if (data.shipmentsCount && data.shipmentsCount > 0) {
      prev.shipments.count = data.shipmentsCount;
      prev.shipments.completed = true;
    }

    if (data.returnsCount && data.returnsCount > 0) {
      prev.returns.count = data.returnsCount;
      prev.returns.completed = true;
    }

    if (data.settlementsCount && data.settlementsCount > 0) {
      prev.settlements.count = data.settlementsCount;
      prev.settlements.completed = true;
    }

    if (data.feesCount && data.feesCount > 0) {
      prev.fees.count = data.feesCount;
      prev.fees.completed = true;
    }

    if (data.claimsDetected && data.claimsDetected > 0) {
      prev.claims.count = data.claimsDetected;
      prev.claims.completed = true;
    }

    previousDataRef.current = prev;
  };

  // Show modal and toast only AFTER logs have finished displaying
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (logsFinished && status === 'completed') {
      // Get claims info (no fallback - use actual backend values)
      const claims = syncData?.claimsDetected ?? null;
      const value = syncData?.totalRecoverableValue ?? null;
      const formattedValue = value !== null
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
        : '--';

      // No toast here - the UI already shows completion status clearly

      // Show modal after a brief pause
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
      }
      sourcesModalTimeoutRef.current = window.setTimeout(() => {
        // Only show modal if user hasn't dismissed it for this sync session
        if (!modalDismissedRef.current) {
          setShowSourcesModal(true);
        }
      }, 1000); // Show modal 1s after logs finish
    } else if (status !== 'completed') {
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
        sourcesModalTimeoutRef.current = null;
      }
      setShowSourcesModal(false);
    }

    return () => {
      if (sourcesModalTimeoutRef.current) {
        window.clearTimeout(sourcesModalTimeoutRef.current);
        sourcesModalTimeoutRef.current = null;
      }
    };
  }, [logsFinished, status, toast, syncData]);

  // Phase 3: Detection updates SSE - connect when sync completes
  // NOTE: This hook ONLY updates syncData state - logs are already handled by main SSE handler
  // to avoid duplicate log messages
  useDetectionUpdates(
    status === 'completed' && syncId ? syncId : null,
    (event) => {
      // Handle detection updates - DON'T add logs here, main SSE handler does that
      if (event.status === 'complete') {
        const totalDetections = event.total_detections ?? null;
        const estimatedValue = event.estimated_value ?? event.totalRecoverableValue ?? null;

        if (totalDetections !== null && totalDetections > 0) {
          // ⭐ UPDATE syncData so "Potential Recovery Identified" shows when logsFinished
          // No addLog here - main SSE handler at line 500+ already handles logs
          setSyncData(prev => prev ? {
            ...prev,
            claimsDetected: totalDetections,
            totalRecoverableValue: estimatedValue ?? prev.totalRecoverableValue
          } : prev);
        }
      } else if (event.new_detections_count && event.new_detections_count > 0) {
        const estimatedValue = event.estimated_value ?? null;

        // ⭐ UPDATE syncData for incremental updates too
        // No addLog here - avoid duplicate logs
        setSyncData(prev => prev ? {
          ...prev,
          claimsDetected: (prev.claimsDetected ?? 0) + event.new_detections_count,
          totalRecoverableValue: estimatedValue !== null
            ? (prev.totalRecoverableValue ?? 0) + estimatedValue
            : prev.totalRecoverableValue
        } : prev);
      }
    }
  );

  const updateSyncState = (s: SyncStatusResponse) => {
    // Merge new state with previous, preserving claimsDetected and totalRecoverableValue
    // to avoid race condition where sync completion overwrites detection values
    setSyncData(prev => ({
      ...prev,
      ...s,
      // Preserve detection values if new event doesn't have them
      claimsDetected: s.claimsDetected ?? prev?.claimsDetected,
      totalRecoverableValue: s.totalRecoverableValue ?? prev?.totalRecoverableValue
    }));
    // Hold progress at 98% until logs finish, then show 100%
    if (typeof s.progress === 'number') {
      if (s.progress >= 100 && !logsFinished) {
        setProgress(98); // Hold at 98% while logs are still displaying
      } else {
        setProgress(s.progress);
      }
    }
    if (s.message) setMessage(s.message);

    // Update logs based on sync data
    updateLogsFromSyncData(s);

    // Map status values to match documentation
    let mappedStatus: 'idle' | 'running' | 'detecting' | 'completed' | 'failed' | 'cancelled' = 'idle';
    if (s.status === 'idle') mappedStatus = 'idle';
    else if (s.status === 'running') mappedStatus = 'running';
    else if (s.status === 'detecting') mappedStatus = 'detecting';
    else if (s.status === 'completed' || s.status === 'complete') mappedStatus = 'completed';
    else if (s.status === 'failed') mappedStatus = 'failed';
    else if (s.status === 'cancelled') mappedStatus = 'cancelled';

    // Show toast notifications on status changes
    if (mappedStatus !== previousStatusRef.current) {
      previousStatusRef.current = mappedStatus;

      // Show toast for status transitions
      if (mappedStatus === 'completed' && !toastShownRef.current.completed) {
        toastShownRef.current.completed = true;
        // Mark completion - backend should send completion logs via SSE
        completionLogsAddedRef.current = true;

        // If queue is already empty, mark logs as finished immediately
        if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
          setTimeout(() => {
            if (logQueueRef.current.length === 0 && !logsFinishedRef.current) {
              logsFinishedRef.current = true;
              setLogsFinished(true);
            }
          }, 500); // Brief delay to catch any last-moment logs
        }
      } else if (mappedStatus === 'failed' && !toastShownRef.current.failed) {
        toastShownRef.current.failed = true;
        addLog({ type: 'error', category: 'system', message: `Sync failed: ${s.error || s.message || 'Unknown error'}` });
        toast({
          title: 'Sync Failed',
          description: s.error || s.message || 'The sync encountered an error. Please try again.',
          variant: 'destructive',
          duration: 6000,
        });
      } else if (mappedStatus === 'cancelled' && !toastShownRef.current.cancelled) {
        toastShownRef.current.cancelled = true;
        addLog({ type: 'warning', category: 'system', message: 'Sync cancelled by user' });
        toast({
          title: 'Sync Cancelled',
          description: s.message || 'The sync has been cancelled.',
          duration: 4000,
        });
      }
    }

    setStatus(mappedStatus);

    if (s.error) {
      setError(s.error);
    } else {
      setError(null);
    }
  };

  // Sync syncId state with URL params (only update when URL changes)
  useEffect(() => {
    setSyncId(urlSyncId);
  }, [urlSyncId]);

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;
    let unsubscribe: (() => void) | null = null;

    async function ensureSync() {
      if (!syncId) {
        try {
          // Clear logs and reset state for new sync
          setLogs([]);
          setLogsFinished(false);
          modalDismissedRef.current = false; // Reset modal dismissed flag for new sync
          logsFinishedRef.current = false;
          completionLogsAddedRef.current = false;
          previousDataRef.current = {
            orders: { syncing: false, completed: false, count: 0 },
            inventory: { syncing: false, completed: false, count: 0 },
            shipments: { syncing: false, completed: false, count: 0 },
            returns: { syncing: false, completed: false, count: 0 },
            settlements: { syncing: false, completed: false, count: 0 },
            fees: { syncing: false, completed: false, count: 0 },
            claims: { syncing: false, completed: false, count: 0 },
          };

          addLog({ type: 'info', category: 'system', message: 'Initializing sync...' }, 0);

          const start = await startSync();
          if (cancelled) return;
          const newSyncId = start.syncId;
          setSyncId(newSyncId);
          setStatus('running');
          setMessage(start.message || 'Sync started successfully');
          previousStatusRef.current = 'running';
          toastShownRef.current = { started: true };

          toast({
            title: 'Sync Started',
            description: 'Your Amazon data sync has started. This may take a few minutes.',
            duration: 4000,
          });

          navigate(`/sync?id=${newSyncId}`, { replace: true });
        } catch (e: any) {
          if (cancelled) return;
          const errorMsg = e?.message || 'Failed to start sync';

          // Check if it's a "sync already in progress" error
          const isBlockedError = errorMsg.toLowerCase().includes('already in progress');

          setStatus('failed');
          setMessage(errorMsg);
          setError(errorMsg);
          setIsSyncBlocked(isBlockedError);
          previousStatusRef.current = 'failed';

          if (isBlockedError) {
            addLog({ type: 'warning', category: 'system', message: 'A previous sync appears stuck. Click "Clear & Retry" to continue.' });
          } else {
            addLog({ type: 'error', category: 'system', message: `Failed to start sync: ${errorMsg}` });
          }

          toast({
            title: isBlockedError ? 'Sync Blocked' : 'Failed to Start Sync',
            description: isBlockedError
              ? 'A previous sync is stuck. Use "Clear & Retry" to fix this.'
              : errorMsg,
            variant: 'destructive',
            duration: 5000,
          });
          return;
        }
      } else {
        // Load existing sync status
        try {
          addLog({ type: 'info', category: 'system', message: `Loading sync status...` });
          const s = await getSyncStatus(syncId);
          if (cancelled) return;

          console.log('[Sync] Received sync status:', s);
          updateSyncState(s);
        } catch (e: any) {
          if (cancelled) return;
          console.error('Failed to load sync status:', e);
          const errorMessage = e?.message || 'Failed to load sync status';

          if (errorMessage.includes('not found') || errorMessage.includes('Sync not found')) {
            setSyncId(undefined);
            setSyncData(null);
            setStatus('idle');
            setProgress(0);
            setMessage('Sync not found. Please start a new sync.');
            setError(null);
            navigate('/sync', { replace: true });

            toast({
              title: 'Sync Not Found',
              description: 'The sync you were viewing no longer exists. Please start a new sync.',
              duration: 5000,
            });
          } else {
            setError(errorMessage);
            addLog({ type: 'error', category: 'system', message: `Error: ${errorMessage}` });
            toast({
              title: 'Error Loading Sync Status',
              description: errorMessage || 'Failed to load sync status. Please refresh the page.',
              variant: 'destructive',
              duration: 5000,
            });
          }
        }
      }
    }

    ensureSync();

    // Prefer SSE realtime; fall back to polling if EventSource fails
    if (syncId) {
      try {
        unsubscribe = subscribeSyncProgress(syncId, (s: any) => {
          if (cancelled) return;

          // Handle log events from backend
          if (s.type === 'log' && s.log) {
            console.log('[Sync] Log event received:', s.log);
            addLog({
              type: s.log.type || 'info',
              category: s.log.category || 'system',
              message: s.log.message,
              count: s.log.count,
              context: s.log.context
            });
            return;
          }

          // Handle detection.completed event (sent after sync completes)
          if (s.type === 'detection' && s.status === 'completed') {
            console.log('[Sync] Detection completed event received:', s);
            const detectedCount = s.claimsDetected ?? null;
            const estimatedValue = s.totalRecoverableValue ?? null;

            // ⭐ UPDATE syncData - but DON'T show toast here, let the main completion flow handle it
            setSyncData(prev => prev ? {
              ...prev,
              claimsDetected: detectedCount ?? prev.claimsDetected,
              totalRecoverableValue: estimatedValue ?? prev.totalRecoverableValue
            } : prev);

            if (detectedCount !== null && detectedCount > 0) {
              // Only log value if backend provides it
              if (estimatedValue !== null) {
                const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(estimatedValue);
                addLog({ type: 'success', category: 'detection', message: `Recoveries: ${formattedValue} from ${detectedCount} discrepancies`, count: detectedCount }, 1200);
              } else {
                addLog({ type: 'success', category: 'detection', message: `${detectedCount} recoveries found (awaiting value)`, count: detectedCount }, 1200);
              }
              // Toast will be shown when logsFinished becomes true
            }
            return;
          }

          updateSyncState(s);

          if (s.status === 'failed' || s.status === 'cancelled') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        });
      } catch (err) {
        console.error('SSE connection failed, falling back to polling:', err);
      }
    }

    // Polling fallback - continue polling after completion to catch async detection results
    let pollsAfterComplete = 0;
    const MAX_POLLS_AFTER_COMPLETE = 12; // 12 polls × 3s = 36 seconds for detection to complete

    interval = setInterval(async () => {
      if (!syncId || cancelled) return;
      try {
        const s = await getSyncStatus(syncId);
        if (cancelled) return;
        updateSyncState(s);

        if (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled') {
          pollsAfterComplete++;

          if (pollsAfterComplete >= MAX_POLLS_AFTER_COMPLETE || s.status === 'failed' || s.status === 'cancelled') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (err?.message?.includes('not found') || err?.message?.includes('Sync not found')) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          setSyncId(undefined);
          setSyncData(null);
          setStatus('idle');
          setProgress(0);
          setMessage('Sync not found. Please start a new sync.');
          navigate('/sync', { replace: true });
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from SSE:', err);
        }
      }
    };
  }, [syncId, navigate]);

  const handleCancelSync = async () => {
    if (!syncId || status !== 'running') return;

    setIsCancelling(true);
    addLog({ type: 'warning', category: 'system', message: 'Cancelling sync...' });
    try {
      await cancelSync(syncId);
      setStatus('cancelled');
      setMessage('Sync cancelled');
      previousStatusRef.current = 'cancelled';
      toastShownRef.current.cancelled = true;

      toast({
        title: 'Sync Cancelled',
        description: 'The sync has been cancelled successfully.',
        duration: 4000,
      });

      const s = await getSyncStatus(syncId);
      updateSyncState(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to cancel sync');
      addLog({ type: 'error', category: 'system', message: `Failed to cancel: ${e?.message}` });
      toast({
        title: 'Failed to Cancel Sync',
        description: e?.message || 'Failed to cancel sync. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetry = () => {
    setSyncId(undefined);
    setProgress(0);
    setStatus('idle');
    setMessage('Initializing sync...');
    setError(null);
    setSyncData(null);
    setLogs([]);
    previousStatusRef.current = 'idle';
    toastShownRef.current = {};
    previousDataRef.current = {
      orders: { syncing: false, completed: false, count: 0 },
      inventory: { syncing: false, completed: false, count: 0 },
      shipments: { syncing: false, completed: false, count: 0 },
      returns: { syncing: false, completed: false, count: 0 },
      settlements: { syncing: false, completed: false, count: 0 },
      fees: { syncing: false, completed: false, count: 0 },
      claims: { syncing: false, completed: false, count: 0 },
    };

    toast({
      title: 'Retrying Sync',
      description: 'Starting a new sync...',
      duration: 3000,
    });

    window.location.reload();
  };

  // Force clear stuck syncs and retry
  const handleForceClear = async () => {
    setIsClearing(true);
    addLog({ type: 'info', category: 'system', message: 'Clearing stuck sync...' });

    try {
      const result = await forceClearSync();

      toast({
        title: 'Sync Cleared',
        description: result.message,
        duration: 3000,
      });

      addLog({ type: 'success', category: 'system', message: result.message });

      // Reset state and start new sync
      setIsSyncBlocked(false);
      setError(null);
      setSyncId(undefined);
      setStatus('idle');
      setProgress(0);

      // Small delay then reload to start fresh sync
      setTimeout(() => {
        window.location.href = '/sync';
      }, 500);
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to clear stuck sync';
      setError(errorMsg);
      addLog({ type: 'error', category: 'system', message: errorMsg });

      toast({
        title: 'Failed to Clear',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Export logs as styled HTML (printable as PDF) for support tickets
  const exportLogs = () => {
    const exportDate = new Date().toLocaleString();

    const logRows = logs.map(log => {
      const time = log.timestamp.toLocaleString();
      const typeColor = log.type === 'error' ? '#dc2626' : log.type === 'warning' ? '#d97706' : log.type === 'success' ? '#059669' : '#6b7280';
      return `<tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${time}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: ${typeColor}; font-weight: 600; text-transform: uppercase;">${log.type}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #374151;">${log.category}</td>
        <td style="padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #111827;">${log.message}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Margin | Sync Logs - ${exportDate}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #111827; font-size: 24px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .meta span { margin-right: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { padding: 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="margin-bottom: 20px;">
    <img src="/logoimagetwo.png" alt="Margin Logo" style="height: 48px; object-fit: contain;" />
  </div>
  <div class="meta">
    <span><strong>Exported:</strong> ${exportDate}</span>
    <span><strong>Sync ID:</strong> ${syncId || 'N/A'}</span>
    <span><strong>Status:</strong> ${status}</span>
    <span><strong>Total Entries:</strong> ${logs.length}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 160px;">Timestamp</th>
        <th style="width: 80px;">Type</th>
        <th style="width: 100px;">Category</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>${logRows}</tbody>
  </table>
  <p style="margin-top: 24px; font-size: 11px; color: #9ca3af;">
    To save as PDF: Press Ctrl+P (Cmd+P on Mac) → Select "Save as PDF" as destination → Click Save
  </p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    toast({
      title: 'Logs Exported',
      description: 'Logs opened in new tab. Press Ctrl+P to save as PDF.',
      duration: 5000,
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'detecting':
        return <Target className="h-5 w-5 text-purple-500 animate-pulse" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  // Format timestamp for log display - returns { short: "HH:MM", full: "Dec 19, 2024 3:45 PM" }
  const formatTimestamp = (date: Date) => {
    const short = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const full = date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { short, full };
  };

  // Get agent-specific color based on category
  // Maps backend data categories to agent colors
  const getAgentColor = (category: string) => {
    switch (category) {
      // Agent 1: OAuth/Auth
      case 'auth':
      case 'oauth':
        return 'text-blue-500';

      // Agent 2: Sync - all data ingestion
      case 'orders':
      case 'inventory':
      case 'shipments':
      case 'returns':
      case 'settlements':
      case 'fees':
      case 'sync':
        return 'text-cyan-500';

      // Agent 3: Detection - finds discrepancies
      case 'detection':
        return 'text-purple-500';

      // Agent 4: Evidence Collection
      case 'evidence':
        return 'text-green-500';

      // Agent 5: Parsing - document parsing
      case 'parsing':
        return 'text-yellow-500';

      // Agent 6: Matching - evidence to claims
      case 'matching':
        return 'text-pink-500';

      // Agent 7: Filing - files claims to Amazon
      case 'claims':
      case 'filing':
        return 'text-orange-500';

      // Agent 8: Recovery - tracks payouts
      case 'recovery':
        return 'text-teal-500';

      // Agent 9: Billing - commission billing
      case 'billing':
        return 'text-indigo-500';

      // Agent 10: Notify - notifications
      case 'notify':
      case 'notification':
        return 'text-red-500';

      // Agent 11: Learning - learns from rejections
      case 'learning':
        return 'text-violet-500';

      // System messages
      case 'system':
        return 'text-gray-500';

      default:
        return 'text-cyan-500'; // Default to sync color
    }
  };

  // Get agent label based on category
  // Maps backend data categories to human-readable agent names
  const getAgentLabel = (category: string) => {
    switch (category) {
      // Agent 1: OAuth/Auth
      case 'auth':
      case 'oauth':
        return '[Agent 1: Auth]';

      // Agent 2: Sync - all data ingestion categories
      case 'orders':
        return '[Agent 2: Orders]';
      case 'inventory':
        return '[Agent 2: Inventory]';
      case 'shipments':
        return '[Agent 2: Shipments]';
      case 'returns':
        return '[Agent 2: Returns]';
      case 'settlements':
        return '[Agent 2: Settlements]';
      case 'fees':
        return '[Agent 2: Fees]';
      case 'sync':
        return '[Agent 2: Sync]';

      // Agent 3: Detection
      case 'detection':
        return '[Agent 3: Detection]';

      // Agent 4: Evidence
      case 'evidence':
        return '[Agent 4: Evidence]';

      // Agent 5: Parsing
      case 'parsing':
        return '[Agent 5: Parsing]';

      // Agent 6: Matching
      case 'matching':
        return '[Agent 6: Matching]';

      // Agent 7: Filing
      case 'claims':
      case 'filing':
        return '[Agent 7: Filing]';

      // Agent 8: Recovery
      case 'recovery':
        return '[Agent 8: Recovery]';

      // Agent 9: Billing
      case 'billing':
        return '[Agent 9: Billing]';

      // Agent 10: Notify
      case 'notify':
      case 'notification':
        return '[Agent 10: Notify]';

      // Agent 11: Learning
      case 'learning':
        return '[Agent 11: Learning]';

      // System
      case 'system':
        return '[System]';

      default:
        return `[${category}]`;
    }
  };

  // Get log entry color - using lighter colors for dark theme terminal
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'progress': return 'text-blue-400';
      case 'thinking': return 'text-gray-500 italic';
      default: return 'text-gray-300'; // Light gray for regular messages on dark bg
    }
  };

  // Calculate totals
  const totalItemsSynced = syncData ? (
    (syncData.ordersProcessed || 0) +
    (syncData.inventoryCount || 0) +
    (syncData.shipmentsCount || 0) +
    (syncData.returnsCount || 0) +
    (syncData.settlementsCount || 0) +
    (syncData.feesCount || 0)
  ) : 0;

  // Get actual recoverable value from backend - NO FALLBACK
  // Backend now calculates real values from detection_results.amount
  const claimsCount = syncData?.claimsDetected ?? null;
  const totalRecoverableValue = syncData?.totalRecoverableValue ?? null;

  // Format currency - returns '--' if value is null/undefined (no fallback)
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate duration in seconds
  const calculateDuration = (): number | null => {
    if (syncData?.startedAt && syncData?.completedAt) {
      const started = new Date(syncData.startedAt).getTime();
      const completed = new Date(syncData.completedAt).getTime();
      return Math.round((completed - started) / 1000);
    }
    return null;
  };

  const durationSeconds = calculateDuration();

  return (
    <PageLayout title="" hideNavbar hideSidebar plainBackground logoFontFamily='"Nunito Sans", sans-serif'>
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-8 py-8 text-gray-900">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900 font-montserrat">Data Synchronization</h1>
            <p className="text-xs text-gray-400 mt-1 font-montserrat">Amazon SP-API Sync</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {/* Add shimmer animation to global styles */}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>

            {/* Main Content */}
            <div className="space-y-4">
              {/* Detecting Phase */}
              {status === 'detecting' && (
                <div className="py-4 bg-gray-50 px-5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-gray-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 font-montserrat">Analyzing for discrepancies</p>
                      <p className="text-xs text-gray-500 font-montserrat">AI-powered detection scanning your data</p>
                    </div>
                  </div>
                </div>
              )}


              {/* Status Strip */}
              {logs.length > 0 && status === 'completed' && (
                <div className="flex items-center gap-3 text-xs font-montserrat">
                  {syncData?.completedAt && (
                    <span className="text-gray-400">
                      Last sync: {(() => {
                        const completedTime = new Date(syncData.completedAt).getTime();
                        const now = Date.now();
                        const diffMs = now - completedTime;
                        const diffMins = Math.floor(diffMs / (1000 * 60));
                        if (diffMins < 1) return 'just now';
                        if (diffMins < 60) return `${diffMins} min ago`;
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        return `${diffHours}h ago`;
                      })()}
                    </span>
                  )}
                  {/* Overall status - issues show in the Issues filter */}
                  {(() => {
                    const hasError = healthGroups.some(g => g.status === 'error');
                    const hasWarning = healthGroups.some(g => g.status === 'warning');
                    const hasZeroClaims = claimsCount !== null && claimsCount === 0;

                    if (hasError) {
                      return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-medium border border-gray-200">Issues detected</span>;
                    } else if (hasWarning) {
                      return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-medium border border-gray-200">Warnings</span>;
                    } else if (hasZeroClaims) {
                      return (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 border border-gray-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Account clean
                        </span>
                      );
                    }
                    return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-medium border border-gray-200">All systems OK</span>;
                  })()}
                </div>
              )}

              {/* Real-time Logs Section */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Activity Log</h4>
                    <span className="text-xs text-gray-400 font-mono">{filteredLogs.length} entries</span>
                  </div>
                </div>

                {/* Filter Toggles */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 mr-1">Filter:</span>
                  <div className="flex rounded-lg bg-gray-100 p-0.5">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${logFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}>
                      All
                    </button>
                    <button
                      onClick={() => setLogFilter('money')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${logFilter === 'money'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}>
                      Recoveries
                    </button>
                    <button
                      onClick={() => setLogFilter('issues')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${logFilter === 'issues'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}>
                      Issues
                    </button>
                  </div>

                  {/* Export Button */}
                  {logs.length > 0 && (
                    <button
                      onClick={exportLogs}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all"
                      title="Export logs for support">
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </button>
                  )}
                </div>

                {/* Search Bar - Clean minimal design */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    type="text"
                    placeholder="Search sync history (e.g. 'Inventory', 'Errors')..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-10 h-9 text-sm bg-gray-50/50 border-gray-100 focus:bg-white focus:border-gray-200 rounded-lg placeholder:text-gray-300"
                  />
                </div>

                {/* Log Container - Institutional Dark Theme */}
                <div className="relative group">
                  {/* Header bar - true black */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-[#111111] rounded-t-lg border-b border-neutral-800 flex items-center px-4 justify-between z-10">
                    <span className="text-xs font-medium text-neutral-400 font-montserrat">Agent Activity</span>
                    <div className="flex items-center gap-2">
                      {status === 'running' || status === 'detecting' ? (
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-400 tracking-wide">LIVE</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-medium">IDLE</span>
                      )}
                    </div>
                  </div>

                  <div
                    ref={logContainerRef}
                    className="bg-black rounded-lg pt-10 pb-4 px-4 font-montserrat text-xs h-80 overflow-y-auto scroll-smooth border border-neutral-800 shadow-2xl relative">
                    {/* Subtle grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-lg"></div>

                    {filteredLogs.length === 0 ? (
                      <div className="text-gray-400 flex flex-col items-center justify-center h-full relative z-10">
                        {logFilter === 'issues' ? (
                          <>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                              <span className="text-2xl">✓</span>
                            </div>
                            <span className="text-sm font-medium text-emerald-400 mb-1">All systems running smoothly</span>
                            <span className="text-xs text-gray-500">No errors or warnings detected during this sync</span>
                          </>
                        ) : logFilter === 'money' ? (
                          <>
                            <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                            <span className="text-xs tracking-widest opacity-40">NO RECOVERY EVENTS YET...</span>
                            <span className="text-[10px] text-gray-500 mt-1">Claims and reimbursements will appear here</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-8 w-8 mb-2 animate-spin opacity-20" />
                            <span className="text-xs tracking-widest opacity-40">WAITING FOR SIGNAL...</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 relative z-10">
                        {logStories.map((story) => {
                          const isExpanded = expandedStories.has(story.id);
                          const isRunning = !story.isCompleted && (status === 'running' || status === 'detecting');

                          // Highlight function for log content
                          const highlightContent = (text: string) => {
                            const parts = text.split(/(\$[\d,]+\.?\d*|\b\d+\b|\[.*?\])/g);
                            return parts.map((part, i) => {
                              if (part.match(/^\$[\d,]+\.?\d*$/)) {
                                return <span key={i} className="text-emerald-600 font-bold">{part}</span>;
                              }
                              if (part.match(/^\d+$/)) {
                                return <span key={i} className="text-blue-600 font-bold">{part}</span>;
                              }
                              if (part.match(/^\[.*?\]$/)) {
                                return <span key={i} className="text-purple-600 font-bold">{part}</span>;
                              }
                              return part;
                            });
                          };

                          return (
                            <div key={story.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                              {/* Story Header - Clickable */}
                              <button
                                onClick={() => toggleStory(story.id)}
                                className="w-full text-left flex items-center gap-2.5 py-2 px-3 rounded hover:bg-neutral-900 transition-colors group">
                                {/* Expand/Collapse Icon */}
                                <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </span>

                                {/* Status Icon */}
                                {isRunning ? (
                                  <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                                ) : story.isCompleted ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                )}

                                {/* Title & Summary */}
                                <span className="font-medium text-neutral-200 text-xs">{story.title}</span>
                                <span className="text-neutral-500 text-xs">— {story.summary}</span>
                              </button>

                              {/* Expanded Log Details */}
                              {isExpanded && (
                                <div className="ml-7 pl-3 border-l border-neutral-800 mt-1 space-y-1">
                                  {story.logs.map((log, index) => {
                                    // First, humanize any error/warning messages
                                    const humanized = humanizeErrorMessage(log.message, log.type);
                                    // Then apply money/action enrichment
                                    const enriched = enrichLogMessage(humanized.text, story);

                                    return (
                                      <React.Fragment key={log.id}>
                                        <div
                                          className={`flex items-start gap-3 py-1 text-xs ${log.type === 'thinking' ? 'opacity-50' : ''} ${humanized.isHumanized ? 'bg-neutral-900/50 -mx-2 px-2 py-1.5 rounded' : ''}`}>
                                          {/* Timestamp with hover for exact time */}
                                          <span
                                            className="hidden sm:inline text-neutral-600 shrink-0 text-[10px] font-mono cursor-help"
                                            title={formatTimestamp(log.timestamp).full}>
                                            {formatTimestamp(log.timestamp).short}
                                          </span>

                                          {/* Message */}
                                          <span className={`${humanized.isHumanized ? 'text-neutral-300' : getLogColor(log.type)} break-all flex-1`}>
                                            {highlightContent(enriched.text)}
                                            {index === story.logs.length - 1 && isRunning && (
                                              <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                            )}
                                          </span>

                                          {/* Enrichment Hint Badge */}
                                          {enriched.hint && (
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${enriched.hint.includes('$')
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-gray-100 text-gray-600'
                                              }`}>
                                              {enriched.hint}
                                            </span>
                                          )}
                                        </div>
                                        {/* Render context.details if present */}
                                        {log.context?.details && log.context.details.length > 0 && (
                                          <div className="ml-12 mt-1 mb-2 space-y-0.5 text-[11px] text-gray-300">
                                            {log.context.details.map((detail, i) => (
                                              <div key={i} className={detail.startsWith('✅') ? 'text-emerald-400' : ''}>
                                                {detail}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}

                                  {/* Link to Claims - show when there's money potential or anomalies */}
                                  {story.linkTo && story.isCompleted && ((story.anomaliesFound || 0) > 0 || (story.potentialValue || 0) > 0) && (
                                    <div className="mt-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigate(story.linkTo!); }}
                                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                        View potential claims <ExternalLink className="h-3 w-3" />
                                      </button>
                                      <span className="text-[10px] text-gray-500 mt-1 block">
                                        Next: review and approve for filing
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                              }
                            </div>
                          );
                        })}

                        {/* Scroll anchor */}
                        <div className="h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button - Below Real-Time Log */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={async () => {
                  try {
                    // Clear logs and reset state for new sync
                    setLogs([]);
                    setLogsFinished(false);
                    logsFinishedRef.current = false;
                    completionLogsAddedRef.current = false;
                    setStatus('idle');
                    setSyncId(undefined);
                    setError(null);
                    previousDataRef.current = {
                      orders: { syncing: false, completed: false, count: 0 },
                      inventory: { syncing: false, completed: false, count: 0 },
                      shipments: { syncing: false, completed: false, count: 0 },
                      returns: { syncing: false, completed: false, count: 0 },
                      settlements: { syncing: false, completed: false, count: 0 },
                      fees: { syncing: false, completed: false, count: 0 },
                      claims: { syncing: false, completed: false, count: 0 },
                    };

                    addLog({ type: 'info', category: 'system', message: 'Initializing sync...' }, 0);

                    const start = await startSync();
                    const newSyncId = start.syncId;
                    setSyncId(newSyncId);
                    setStatus('running');
                    setMessage(start.message || 'Sync started successfully');
                    previousStatusRef.current = 'running';
                    toastShownRef.current = { started: true };

                    toast({
                      title: 'Sync Started',
                      description: 'Your Amazon data sync has started. This may take a few minutes.',
                      duration: 4000,
                    });

                    navigate(`/sync?id=${newSyncId}`, { replace: true });
                  } catch (e: any) {
                    setStatus('failed');
                    setMessage(e?.message || 'Failed to start sync');
                    setError(e?.message || 'Failed to start sync');
                    toast({
                      title: 'Sync Failed',
                      description: e?.message || 'Failed to start sync. Please try again.',
                      variant: 'destructive',
                      duration: 5000,
                    });
                  }
                }}
                disabled={status === 'running'}
                className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed">
                {status === 'running' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Again
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-2">
              {syncData?.startedAt && (
                <span>Started: {new Date(syncData.startedAt).toLocaleString()}</span>
              )}
              {syncData?.completedAt && (
                <>
                  <span>•</span>
                  <span>Completed: {new Date(syncData.completedAt).toLocaleString()}</span>
                </>
              )}
            </div>



            <div className="flex flex-wrap items-center gap-2 pt-4">
              {status === 'running' && (
                <Button
                  variant="outline"
                  onClick={handleCancelSync}
                  disabled={isCancelling}
                  className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800">
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Sync
                    </>
                  )}
                </Button>
              )}

              {(status === 'failed' || status === 'cancelled') && (
                <>
                  {isSyncBlocked ? (
                    <Button
                      variant="outline"
                      onClick={handleForceClear}
                      disabled={isClearing}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-amber-50">
                      {isClearing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear & Retry
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Sync
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  if (status === 'completed') {
                    navigate(`/app/${currentTenantSlug}/dashboard`);
                  }
                }}
                disabled={status !== 'completed'}
                className={
                  status === 'completed'
                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }>
                Dashboard
              </Button>
            </div>

            {/* Audit Complete Modal */}
            <Dialog
              open={showSourcesModal}
              onOpenChange={(open) => {
                if (!open) {
                  // User dismissed the modal (clicked X or outside)
                  modalDismissedRef.current = true;
                }
                setShowSourcesModal(open);
              }}>
              <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-gray-200 rounded-sm shadow-2xl bg-white">
                <DialogHeader className="px-6 py-5 bg-[#111827] border-b border-[#111827]">
                  <DialogTitle className="text-xs font-semibold text-white uppercase tracking-[0.2em]">
                    Connect Document Sources
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-gray-400 mt-1 font-medium tracking-wide uppercase">
                    AUTHORIZED ACCESS FOR DOCUMENT INGESTION
                  </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={async () => {
                        try {
                          setProviderLoading('gmail');
                          const r = await api.connectDocs('gmail');
                          if (r.ok && r.data?.auth_url) {
                            window.location.href = r.data.auth_url;
                          } else {
                            toast({
                              title: 'Connection Failed',
                              description: r.error || 'Failed to initiate Gmail connection.',
                              variant: 'destructive',
                            });
                            setProviderLoading(null);
                          }
                        } catch (error) {
                          toast({
                            title: 'Connection Failed',
                            description: 'An error occurred. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      }}
                      disabled={providerLoading === 'gmail'}
                      className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                      {providerLoading === 'gmail' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                      ) : (
                        <img src={GmailIcon} alt="Gmail" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                      )}
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider group-hover:text-black">Gmail</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          setProviderLoading('outlook');
                          const r = await api.connectDocs('outlook');
                          if (r.ok && r.data?.auth_url) {
                            window.location.href = r.data.auth_url;
                          } else {
                            toast({
                              title: 'Connection Failed',
                              description: r.error || 'Failed to initiate Outlook connection.',
                              variant: 'destructive',
                            });
                            setProviderLoading(null);
                          }
                        } catch (error) {
                          toast({
                            title: 'Connection Failed',
                            description: 'An error occurred. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      }}
                      disabled={providerLoading === 'outlook'}
                      className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                      {providerLoading === 'outlook' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                      ) : (
                        <img src={OutlookIcon} alt="Outlook" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                      )}
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider group-hover:text-black">Outlook</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          setProviderLoading('gdrive');
                          const r = await api.connectDocs('gdrive');
                          if (r.ok && r.data?.auth_url) {
                            window.location.href = r.data.auth_url;
                          } else {
                            toast({
                              title: 'Connection Failed',
                              description: r.error || 'Failed to initiate Google Drive connection.',
                              variant: 'destructive',
                            });
                            setProviderLoading(null);
                          }
                        } catch (error) {
                          toast({
                            title: 'Connection Failed',
                            description: 'An error occurred. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      }}
                      disabled={providerLoading === 'gdrive'}
                      className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                      {providerLoading === 'gdrive' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                      ) : (
                        <img src={GoogleDriveIcon} alt="Google Drive" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                      )}
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider group-hover:text-black">Drive</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          setProviderLoading('dropbox');
                          const r = await api.connectDocs('dropbox');
                          if (r.ok && r.data?.auth_url) {
                            window.location.href = r.data.auth_url;
                          } else {
                            toast({
                              title: 'Connection Failed',
                              description: r.error || 'Failed to initiate Dropbox connection.',
                              variant: 'destructive',
                            });
                            setProviderLoading(null);
                          }
                        } catch (error) {
                          toast({
                            title: 'Connection Failed',
                            description: 'An error occurred. Please try again.',
                            variant: 'destructive',
                          });
                          setProviderLoading(null);
                        }
                      }}
                      disabled={providerLoading === 'dropbox'}
                      className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                      {providerLoading === 'dropbox' ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                      ) : (
                        <img src={DropboxIcon} alt="Dropbox" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                      )}
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider group-hover:text-black">Dropbox</span>
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSourcesModal(false)}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium">
                    Skip for Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
