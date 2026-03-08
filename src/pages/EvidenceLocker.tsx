import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Search, Mail, Check, AlertTriangle, Clock, Eye, Download, ExternalLink, Loader2, FolderSearch, ScanLine, FileCheck, Link2, Trash2, MoreHorizontal, RefreshCw, Hexagon, CheckCircle2, XCircle, Activity, AlertCircle, ArrowRight, Shield, Terminal, Cloud, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { api } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { GmailConnectionStatus } from '@/components/evidence/GmailConnectionStatus';
import { EvidenceIngestion } from '@/components/evidence/EvidenceIngestion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DocumentReuseInfo } from '@/components/evidence/DocumentReuseInfo';

// Document Log entry type
interface DocLogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'progress' | 'thinking';
  category: 'upload' | 'parse' | 'match' | 'system';
  message: string;
  thinkingDuration?: number;
  // Seller-friendly story fields
  storyMessage?: string;
  moneyImpact?: number;
  claimsAffected?: number;
  isDevLog?: boolean;
}

// Story-style message templates for seller-friendly logs
const generateStoryMessage = (
  eventType: string,
  data: {
    source?: string;
    count?: number;
    matched?: number;
    unmatched?: number;
    asin?: string;
    sku?: string;
    lineItems?: number;
    claimsLinked?: number;
    claimType?: string;
    docsAttached?: number;
    moneyAtRisk?: number;
    filename?: string;
    supplier?: string;
  }
): { story: string; money?: number; claims?: number } => {
  switch (eventType) {
    case 'gmail_scan':
      return {
        story: `📧 Found ${data.count || 0} new invoice${(data.count || 0) !== 1 ? 's' : ''} in ${data.source || 'Gmail'} – ${data.matched || 0} matched to ${data.asin ? `ASIN ${data.asin}` : 'claims'}, ${data.unmatched || 0} unmatched`,
        claims: data.matched
      };
    case 'invoice_parsed':
      return {
        story: `📄 Parsed ${data.supplier ? `${data.supplier} invoice` : 'supplier invoice'} – extracted ${data.lineItems || 0} line item${(data.lineItems || 0) !== 1 ? 's' : ''}, ${data.claimsLinked || 0} linked to open claims`,
        claims: data.claimsLinked
      };
    case 'claim_packet':
      return {
        story: `📦 Generated claim packet for ${data.claimType || 'Lost Inventory'} – ${data.docsAttached || 0} doc${(data.docsAttached || 0) !== 1 ? 's' : ''} attached`,
        claims: 1
      };
    case 'invoice_linked':
      return {
        story: `💰 New invoice linked → strengthens ${data.claimsLinked || 0} claim${(data.claimsLinked || 0) !== 1 ? 's' : ''} (+$${(data.moneyAtRisk || 0).toLocaleString()} at risk if missing)`,
        money: data.moneyAtRisk,
        claims: data.claimsLinked
      };
    case 'doc_upload':
      return {
        story: `📤 Uploaded "${data.filename || 'document'}" – scanning for order IDs, ASINs & amounts...`
      };
    case 'match_found':
      return {
        story: `✅ Match found! ${data.sku ? `SKU ${data.sku}` : 'Document'} linked to ${data.claimsLinked || 1} claim${(data.claimsLinked || 1) !== 1 ? 's' : ''} (+$${(data.moneyAtRisk || 0).toFixed(0)} recovery potential)`,
        money: data.moneyAtRisk,
        claims: data.claimsLinked
      };
    case 'no_match':
      return {
        story: `⏳ "${data.filename || 'Document'}" parsed but no claim match yet – will auto-link when matching claim detected`
      };
    case 'approval_boost':
      return {
        story: `📈 Evidence complete! ${data.claimsLinked || 0} claim${(data.claimsLinked || 0) !== 1 ? 's' : ''} now at "Auto-Submit" strength (was "Needs Evidence")`,
        claims: data.claimsLinked
      };
    default:
      return { story: data.filename || 'Processing...' };
  }
};


// Category icons for document logs
const getDocCategoryIcon = (category: DocLogEntry['category']) => {
  switch (category) {
    case 'upload': return <Upload className="h-3.5 w-3.5" />;
    case 'parse': return <ScanLine className="h-3.5 w-3.5" />;
    case 'match': return <Link2 className="h-3.5 w-3.5" />;
    case 'system': return <FolderSearch className="h-3.5 w-3.5" />;
  }
};

// Get log color for the Matrix Terminal
const getDocLogColor = (type: DocLogEntry['type']) => {
  switch (type) {
    case 'success': return 'text-emerald-500 font-bold';
    case 'error': return 'text-rose-500';
    case 'warning': return 'text-amber-500';
    case 'progress': return 'text-emerald-500/60';
    case 'thinking': return 'text-white/40 italic';
    default: return 'text-white/60';
  }
};

// Format timestamp
const formatDocTimestamp = (date: Date) => {
  return date.toISOString().replace('T', ' ').slice(0, 23);
};
export default function EvidenceLocker() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug || 'beta';
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);
  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const [dragActive, setDragActive] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Array<{
    id: string;
    name: string;
    uploadDate: string;
    status: string;
    linkedSKUs?: number;
    supplier?: string;
    invoice?: string;
    amount?: number;
    parsedVia?: 'regex' | 'ocr' | 'ml';
    matchedClaims?: string[];
    type?: string;
    parser_status?: string;
    parser_confidence?: number;
    parsed_metadata?: any;
    match_confidence?: number;
    match_status?: 'auto_submit' | 'smart_prompt' | 'hold' | null;
    // Agent 5 extracted data
    extracted?: {
      order_ids?: string[];
      asins?: string[];
      skus?: string[];
      fnskus?: string[];
      tracking_numbers?: string[];
      amounts?: string[];
      invoice_numbers?: string[];
      dates?: string[];
      extraction_method?: string;
    };
    match_reasoning?: string;
    matched_fields?: string[];
  }>>([]);

  // Helper: Get match status based on confidence threshold
  const getMatchStatus = (confidence?: number): 'auto_submit' | 'smart_prompt' | 'hold' | null => {
    if (!confidence || confidence === 0) return null;
    if (confidence >= 0.85) return 'auto_submit';
    if (confidence >= 0.5) return 'smart_prompt';
    return 'hold';
  };

  // Helper: Get match confidence badge
  const getMatchConfidenceBadge = (confidence?: number) => {
    if (!confidence || confidence === 0) return <span className="text-gray-400">—</span>;

    const percentage = Math.round(confidence * 100);
    const status = getMatchStatus(confidence);

    let colorClass = '';
    if (status === 'auto_submit') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    else if (status === 'smart_prompt') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    else colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';

    return (
      <Badge className={colorClass}>
        {percentage}%
      </Badge>
    );
  };

  // Helper: Get match status badge
  const getMatchStatusBadge = (confidence?: number) => {
    const status = getMatchStatus(confidence);
    if (!status) return <span className="text-gray-400">—</span>;

    switch (status) {
      case 'auto_submit':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Check className="w-3 h-3 mr-1" />
          Auto-Submit
        </Badge>;
      case 'smart_prompt':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Smart Prompt
        </Badge>;
      case 'hold':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Hold
        </Badge>;
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [evidenceStatus, setEvidenceStatus] = useState<{ documentsCount: number; processingCount: number } | null>(null);
  const [q, setQ] = useState('');
  const [supplier, setSupplier] = useState('');
  const [type, setType] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<keyof any>('uploadDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Unified upload protocol for Ingestion Nodes
  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: 'Empty upload',
        description: 'Please select at least one document to upload.',
        variant: 'destructive'
      });
      addDocLog({ type: 'warning', category: 'upload', message: 'No documents selected' }, 0);
      return;
    }

    addDocLog({ type: 'info', category: 'upload', message: `Receiving ${files.length} document object(s)...`, thinkingDuration: 1 }, 0);
    addDocLog({ type: 'thinking', category: 'upload', message: `Analyzing: ${files.map(f => f.name).slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}` }, 600);

    toast({
      title: 'Initiating Ingestion',
      description: `Processing ${files.length} document(s)...`
    });

    try {
      setLoading(true);
      const uploadUrls = [
        api.buildApiUrl(`/api/documents/upload?tenantSlug=${activeSlug}`),
        api.buildApiUrl(`/api/evidence/upload?tenantSlug=${activeSlug}`)
      ];

      let lastError: Error | null = null;
      let res: Response | null = null;
      let successfulUrl: string | null = null;

      for (const uploadUrl of uploadUrls) {
        try {
          const form = new FormData();
          for (const f of files) {
            form.append('file', f);
          }
          res = await fetch(uploadUrl, { method: 'POST', credentials: 'include', body: form });
          if (res.ok) { successfulUrl = uploadUrl; break; }
          else {
            const errorText = await res.text();
            lastError = new Error(`Connection error: ${res.status} - ${errorText}`);
          }
        } catch (err: any) { lastError = err; }
      }

      if (!res || !res.ok) throw lastError || new Error('Upload failed');

      addDocLog({ type: 'success', category: 'upload', message: `Successfully uploaded ${files.length} documents` }, 400);
      addDocLog({ type: 'thinking', category: 'parse', message: 'Identifying document details...' }, 800);
      addDocLog({ type: 'progress', category: 'parse', message: 'Scanning for dates, amounts, and IDs...', thinkingDuration: 2 }, 1000);

      toast({
        title: 'Upload successful',
        description: `${files.length} document(s) uploaded. Scanning for details...`,
      });

      const refresh = await api.getDocuments(activeSlug);
      if (refresh.ok && Array.isArray(refresh.data)) {
        const previousCount = documents.length;
        setDocuments(refresh.data);
        if (refresh.data.length > previousCount) {
          const newCount = refresh.data.length - previousCount;
          addDocLog({ type: 'success', category: 'parse', message: `New entries identified: ${newCount}` }, 1200);
        }
      }

      const statusRes = await api.getEvidenceStatus(activeSlug);
      if (statusRes.ok && statusRes.data) setEvidenceStatus(statusRes.data);
    } catch (err: any) {
      addDocLog({ type: 'error', category: 'upload', message: `Upload error: ${err?.message || 'Unknown error'}` }, 0);
      toast({ title: 'Upload failed', description: err?.message || 'Check your connection and try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Document Activity Log state
  const [docLogs, setDocLogs] = useState<DocLogEntry[]>([]);
  const [docLogSearch, setDocLogSearch] = useState('');
  const [showDevLogs, setShowDevLogs] = useState(false); // Toggle for dev-level logs vs human-friendly stories
  const docLogContainerRef = useRef<HTMLDivElement>(null);
  const docLogQueueRef = useRef<Array<{ entry: Omit<DocLogEntry, 'id' | 'timestamp'>; delay: number }>>([]);
  const isProcessingDocQueueRef = useRef(false);

  // Add a log entry immediately
  const addDocLogImmediate = (entry: Omit<DocLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: DocLogEntry = {
      ...entry,
      id: `doclog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setDocLogs(prev => [...prev, newEntry]);
  };

  // Process the log queue with delays
  const processDocLogQueue = async () => {
    if (isProcessingDocQueueRef.current) return;
    isProcessingDocQueueRef.current = true;

    while (docLogQueueRef.current.length > 0) {
      const item = docLogQueueRef.current.shift();
      if (item) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
        addDocLogImmediate(item.entry);
      }
    }

    isProcessingDocQueueRef.current = false;
  };

  // Add a log entry with optional delay (queued)
  const addDocLog = (entry: Omit<DocLogEntry, 'id' | 'timestamp'>, delayMs: number = 0) => {
    if (delayMs === 0 && docLogQueueRef.current.length === 0) {
      addDocLogImmediate(entry);
    } else {
      const baseDelay = entry.type === 'thinking' ? 800 : 400;
      const thinkingDelay = entry.thinkingDuration ? entry.thinkingDuration * 300 : 0;
      docLogQueueRef.current.push({ entry, delay: delayMs || baseDelay + thinkingDelay });
      processDocLogQueue();
    }
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (docLogContainerRef.current) {
      docLogContainerRef.current.scrollTop = docLogContainerRef.current.scrollHeight;
    }
  }, [docLogs]);

  // Filter logs based on search
  const filteredDocLogs = useMemo(() => {
    if (!docLogSearch.trim()) return docLogs;
    const searchLower = docLogSearch.toLowerCase();
    return docLogs.filter(log =>
      log.message.toLowerCase().includes(searchLower) ||
      log.category.toLowerCase().includes(searchLower)
    );
  }, [docLogs, docLogSearch]);

  // Initialize with welcome logs
  useEffect(() => {
    addDocLog({ type: 'info', category: 'system', message: 'Evidence Locker initialized...', thinkingDuration: 2 }, 0);
    addDocLog({ type: 'thinking', category: 'system', message: 'Ready to process invoices, receipts, and purchase orders' }, 1200);
    addDocLog({ type: 'info', category: 'system', message: 'Waiting for documents...' }, 1000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Fetch documents and evidence status
    (async () => {
      if (!isReady) return;
      setLoading(true);
      const [docRes, statusRes, gmailRes] = await Promise.all([
        api.getDocuments(activeSlug),
        api.getEvidenceStatus(activeSlug),
        api.getGmailStatus(activeSlug),
      ]);

      if (!cancelled) {
        if (docRes.ok && Array.isArray(docRes.data)) {
          // Enhance documents with parsed data and matching results
          const enhancedDocs = await Promise.all(
            docRes.data.map(async (doc: any) => {
              let enhancedDoc = { ...doc };

              // Try to get parsed data for each document
              try {
                const parsedRes = await api.getDocumentWithParsedData(doc.id, activeSlug);
                if (parsedRes.ok && parsedRes.data) {
                  enhancedDoc = {
                    ...enhancedDoc,
                    parser_status: parsedRes.data.parser_status,
                    parser_confidence: parsedRes.data.parser_confidence,
                    parsed_metadata: parsedRes.data.parsed_metadata,
                    // Include extracted data from Agent 5
                    extracted: parsedRes.data.extracted,
                  };
                }
              } catch (e) {
                // Ignore errors for individual documents
              }

              // Try to get matching results for each document
              try {
                const matchRes = await api.getDocumentMatchingResults(doc.id, activeSlug);
                if (matchRes.ok && matchRes.data?.results) {
                  const claimIds = matchRes.data.results.map((r: any) => r.claim_id);
                  const highestConfidence = matchRes.data.results.length > 0
                    ? Math.max(...matchRes.data.results.map((r: any) => r.confidence || 0))
                    : 0;
                  // Get match details from best match
                  const bestMatch = matchRes.data.results.find((r: any) => (r.confidence || 0) === highestConfidence);
                  enhancedDoc = {
                    ...enhancedDoc,
                    matchedClaims: claimIds,
                    match_confidence: highestConfidence,
                    match_status: getMatchStatus(highestConfidence),
                    match_reasoning: bestMatch?.reasoning,
                    matched_fields: bestMatch?.matched_fields,
                  };
                }
              } catch (e) {
                // Ignore errors for matching results
              }

              return enhancedDoc;
            })
          );
          setDocuments(enhancedDocs);
          setError(null);
        } else {
          setError(docRes.error || 'Failed to load documents');
        }

        if (statusRes.ok && statusRes.data) {
          setEvidenceStatus(statusRes.data);
        }

        if (gmailRes.ok && gmailRes.data) {
          setGmailConnected(gmailRes.data.connected);
        }

        setLoading(false);
      }
    })();

    // SSE for ingest updates
    let es: EventSource | null = null;
    if (!isReady) return;
    try {
      es = new EventSource(`/api/sse/status?tenantSlug=${activeSlug}`);
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'evidence' && evt?.status === 'completed') {
            const story = generateStoryMessage('gmail_scan', { source: 'Gmail', count: evt.count || 1, matched: evt.matched || 0, unmatched: evt.unmatched || 0 });
            addDocLog({ type: 'success', category: 'system', message: 'New documents found in Gmail', storyMessage: story.story, claimsAffected: story.claims }, 500);
            toast({ title: 'Scan complete', description: 'New documents have been added.' });
            // Refresh documents
            api.getDocuments(activeSlug).then(res => {
              if (res.ok && Array.isArray(res.data)) {
                setDocuments(res.data);
              }
            });
          }
          if (evt?.type === 'parsing' && evt?.status === 'completed') {
            const parseStory = generateStoryMessage('invoice_parsed', { lineItems: evt.lineItems || 0, claimsLinked: evt.claimsLinked || 0, supplier: evt.supplier });
            addDocLog({ type: 'success', category: 'parse', message: `Document scanning finished`, storyMessage: parseStory.story, claimsAffected: parseStory.claims }, 600);
            addDocLog({ type: 'thinking', category: 'match', message: 'Connecting to claims...', storyMessage: '🔍 Looking for matching claims...' }, 900);
            // Refresh document with parsed data
            if (evt?.document_id) {
              api.getDocumentWithParsedData(evt.document_id, activeSlug).then(res => {
                if (res.ok && res.data) {
                  const confidence = res.data.parser_confidence ? `${(res.data.parser_confidence * 100).toFixed(0)}%` : 'N/A';
                  addDocLog({ type: 'info', category: 'parse', message: `Extraction confidence: ${confidence}` }, 800);
                  setDocuments(prev => prev.map(doc =>
                    doc.id === evt.document_id
                      ? { ...doc, parser_status: res.data!.parser_status, parser_confidence: res.data!.parser_confidence, parsed_metadata: res.data!.parsed_metadata }
                      : doc
                  ));
                }
              });

              // Auto-trigger evidence matching after parsing completes
              addDocLog({ type: 'progress', category: 'match', message: 'Running evidence matching...', thinkingDuration: 2 }, 1200);
              api.runEvidenceMatching(undefined, activeSlug).then(matchRes => {
                if (matchRes.ok) {
                  addDocLog({ type: 'info', category: 'match', message: 'Matching engine analyzing document-claim correlations...' }, 1500);
                  toast({
                    title: 'Evidence Matching Started',
                    description: 'Looking for claims that match this document...'
                  });
                } else {
                  addDocLog({ type: 'warning', category: 'match', message: 'Could not start matching - will retry later' }, 1500);
                }
              }).catch(() => {
                addDocLog({ type: 'warning', category: 'match', message: 'Matching service unavailable - will retry later' }, 1500);
              });
            }
          }
          // Handle matching completion event (this is a general message handler, specific event listener below is preferred)
          if (evt?.type === 'matching' && evt?.status === 'completed') {
            const matches = evt.matches || 0;
            const autoSubmitted = evt.autoSubmitted || 0;
            const smartPrompts = evt.smartPromptsCreated || 0;
            const held = evt.held || 0;

            const matchStory = generateStoryMessage('match_found', { claimsLinked: matches, moneyAtRisk: evt.moneyAtRisk || 0 });
            addDocLog({ type: 'success', category: 'match', message: `Found ${matches} match(es)`, storyMessage: matchStory.story, moneyImpact: matchStory.money, claimsAffected: matchStory.claims }, 600);

            if (autoSubmitted > 0) {
              const boostStory = generateStoryMessage('approval_boost', { claimsLinked: autoSubmitted });
              addDocLog({ type: 'success', category: 'match', message: `${autoSubmitted} claim(s) auto-submitted with high confidence`, storyMessage: boostStory.story, claimsAffected: autoSubmitted }, 800);
            }
            if (smartPrompts > 0) {
              addDocLog({ type: 'info', category: 'match', message: `${smartPrompts} smart prompt(s) created for review`, storyMessage: `👀 ${smartPrompts} claim${smartPrompts !== 1 ? 's' : ''} need your review before submission` }, 800);
            }
            if (held > 0) {
              addDocLog({ type: 'warning', category: 'match', message: `${held} match(es) held for manual review (low confidence)`, storyMessage: `⏸️ ${held} low-confidence match${held !== 1 ? 'es' : ''} held – may need more evidence` }, 800);
            }

            // Refresh documents to show updated matched claims
            api.getDocuments(activeSlug).then(res => {
              if (res.ok && Array.isArray(res.data)) {
                // Fetch matching results for each document to populate matchedClaims
                Promise.all(
                  res.data.map(async (doc: any) => {
                    try {
                      const matchRes = await api.getDocumentMatchingResults(doc.id, activeSlug);
                      if (matchRes.ok && matchRes.data?.results) {
                        const claimIds = matchRes.data.results.map((r: any) => r.claim_id);
                        const highestConfidence = matchRes.data.results.length > 0
                          ? Math.max(...matchRes.data.results.map((r: any) => r.confidence || 0))
                          : 0;
                        return {
                          ...doc,
                          matchedClaims: claimIds,
                          match_confidence: highestConfidence,
                          match_status: getMatchStatus(highestConfidence),
                        };
                      }
                      return doc;
                    } catch {
                      return doc;
                    }
                  })
                ).then(enhancedDocs => {
                  setDocuments(enhancedDocs);
                });
              }
            });
          }
        } catch { }
      };

      // Listen for matching start event
      es.addEventListener('matching', (e: MessageEvent) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'matching' && evt?.status === 'started') {
            addDocLog({
              type: 'info',
              category: 'match',
              message: `Searching for claim matches in ${evt.documentCount || 0} document(s)...`
            }, 400);
          }
        } catch { }
      });

      // Listen for specific matching_completed event
      es.addEventListener('matching_completed', (e: MessageEvent) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'matching' && evt?.status === 'completed') {
            const matches = evt.matches || 0;
            const autoSubmitted = evt.autoSubmitted || 0;
            const smartPrompts = evt.smartPromptsCreated || 0;
            const held = evt.held || 0;

            addDocLog({ type: 'success', category: 'match', message: `Found ${matches} match(es)` }, 600);

            if (autoSubmitted > 0) {
              addDocLog({ type: 'success', category: 'match', message: `${autoSubmitted} claim(s) auto-submitted with high confidence` }, 800);
            }
            if (smartPrompts > 0) {
              addDocLog({ type: 'info', category: 'match', message: `${smartPrompts} smart prompt(s) created for review` }, 800);
            }
            if (held > 0) {
              addDocLog({ type: 'warning', category: 'match', message: `${held} match(es) held for manual review (low confidence)` }, 800);
            }

            // Refresh documents to show updated matched claims
            api.getDocuments(activeSlug).then(res => {
              if (res.ok && Array.isArray(res.data)) {
                // Fetch matching results for each document to populate matchedClaims
                Promise.all(
                  res.data.map(async (doc: any) => {
                    try {
                      const matchRes = await api.getDocumentMatchingResults(doc.id, activeSlug);
                      if (matchRes.ok && matchRes.data?.results) {
                        const claimIds = matchRes.data.results.map((r: any) => r.claim_id);
                        const highestConfidence = matchRes.data.results.length > 0
                          ? Math.max(...matchRes.data.results.map((r: any) => r.confidence || 0))
                          : 0;
                        return {
                          ...doc,
                          matchedClaims: claimIds,
                          match_confidence: highestConfidence,
                          match_status: getMatchStatus(highestConfidence),
                        };
                      }
                      return doc;
                    } catch {
                      return doc;
                    }
                  })
                ).then(enhancedDocs => {
                  setDocuments(enhancedDocs);
                });
              }
            });
          }
        } catch { }
      });
    } catch { }

    return () => { cancelled = true; if (es) es.close(); };
  }, [activeSlug, isReady]);
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success border-success/20">
          <Check className="w-3 h-3 mr-1" />
          Verified
        </Badge>;
      case 'processing':
        return <Badge className="bg-primary/10 text-primary border-primary/20">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </Badge>;
      case 'action-required':
        return <Badge className="bg-warning/10 text-warning border-warning/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Action Required
        </Badge>;
      default:
        return null;
    }
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    handleFileUpload(files);
  };
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return documents.filter(d => {
      // Search across all text fields including extracted data
      const searchableText = [
        d.name || '',
        d.supplier || '',
        d.invoice || '',
        ...(d.matchedClaims || []),
        // Extracted fields for comprehensive search
        ...(d.extracted?.order_ids || []),
        ...(d.extracted?.asins || []),
        ...(d.extracted?.skus || []),
        ...(d.extracted?.fnskus || []),
        ...(d.extracted?.tracking_numbers || []),
        ...(d.extracted?.invoice_numbers || []),
      ].join(' ').toLowerCase();

      const matchQ = !term || searchableText.includes(term);
      const matchSupplier = !supplier || (d.supplier || '').toLowerCase().includes(supplier.toLowerCase());
      const matchType = !type || (d.type || '').toLowerCase() === type.toLowerCase();
      const amt = typeof d.amount === 'number' ? d.amount : undefined;
      const matchAmtMin = !amountMin || (amt !== undefined && amt >= parseFloat(amountMin));
      const matchAmtMax = !amountMax || (amt !== undefined && amt <= parseFloat(amountMax));
      const date = d.uploadDate ? new Date(d.uploadDate) : null;
      const matchDateFrom = !dateFrom || (date && date >= new Date(dateFrom));
      const matchDateTo = !dateTo || (date && date <= new Date(dateTo));
      return matchQ && matchSupplier && matchType && matchAmtMin && matchAmtMax && matchDateFrom && matchDateTo;
    });
  }, [q, supplier, type, amountMin, amountMax, dateFrom, dateTo, documents]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a: any, b: any) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      let cmp = 0;
      if (sortBy === 'uploadDate') cmp = new Date(va).getTime() - new Date(vb).getTime();
      else if (sortBy === 'amount') cmp = (va ?? 0) - (vb ?? 0);
      else if (sortBy === 'matchedClaims') cmp = (a.matchedClaims?.length || 0) - (b.matchedClaims?.length || 0);
      else if (sortBy === 'match_confidence') cmp = (a.match_confidence ?? 0) - (b.match_confidence ?? 0);
      else if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb);
      else cmp = String(va ?? '').localeCompare(String(vb ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key: keyof any) => {
    if (sortBy === key) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const exportCsv = () => {
    const rows = sorted.map(d => ({
      id: d.id,
      name: d.name,
      supplier: d.supplier || '',
      invoice: d.invoice || '',
      uploadDate: d.uploadDate,
      status: d.status,
      parsedVia: d.parsedVia || '',
      amount: typeof d.amount === 'number' ? d.amount.toFixed(2) : '',
      matchedClaims: (d.matchedClaims || []).join('|'),
      match_confidence: typeof d.match_confidence === 'number' ? (d.match_confidence * 100).toFixed(0) + '%' : '',
      match_status: d.match_status || '',
      linkedSKUs: d.linkedSKUs ?? '',
    }));
    const header = Object.keys(rows[0] || { id: '', name: '' }).join(',');
    const lines = rows.map(r => Object.values(r).map(v => String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : v).join(','));
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'evidence-documents.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDoc = async (id: string) => {
    try {
      const response = await api.getDocumentDownload(id, activeSlug);
      if (response.ok && response.data?.url) {
        // Open the signed URL directly to download the file
        window.open(response.data.url, '_blank');
      } else {
        toast({
          title: 'Download Failed',
          description: response.error || 'Could not get download URL',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Download Error',
        description: error?.message || 'Failed to download document',
        variant: 'destructive'
      });
    }
  };

  // Delete a single document
  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) {
      return;
    }

    try {
      addDocLog({ type: 'progress', category: 'system', message: `Deleting document: ${docName}...` }, 0);
      const res = await api.deleteDocument(docId, activeSlug);
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        addDocLog({ type: 'success', category: 'system', message: `Document deleted: ${docName}` }, 400);
        toast({ title: 'Document Deleted', description: `"${docName}" has been deleted.` });
      } else {
        throw new Error(res.error || 'Failed to delete document');
      }
    } catch (error: any) {
      addDocLog({ type: 'error', category: 'system', message: `Delete failed: ${error.message}` }, 0);
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Delete all documents
  const handleDeleteAllDocuments = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${documents.length} document(s)? This cannot be undone.`)) {
      return;
    }

    try {
      addDocLog({ type: 'progress', category: 'system', message: `Deleting all ${documents.length} documents...` }, 0);
      const res = await api.deleteAllDocuments(activeSlug);
      if (res.ok) {
        setDocuments([]);
        addDocLog({ type: 'success', category: 'system', message: `Deleted ${res.data?.deletedCount || documents.length} document(s)` }, 400);
        toast({ title: 'All Documents Deleted', description: `${res.data?.deletedCount || documents.length} document(s) have been deleted.` });
      } else {
        throw new Error(res.error || 'Failed to delete documents');
      }
    } catch (error: any) {
      addDocLog({ type: 'error', category: 'system', message: `Delete all failed: ${error.message}` }, 0);
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
      {/* Background Matrix Pattern / Noise */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

      <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
          <div className="relative pt-8">
            <div className="relative w-full max-w-full mx-auto px-8 pb-10 text-white">
              {/* Institutional Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="w-fit px-3 py-0.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-sans font-bold text-[9px] tracking-tight uppercase">
                    Evidence System // Active
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-sans font-bold text-white tracking-tight">Evidence Locker.</h1>
                  <p className="text-white/40 mt-1 font-sans font-light italic text-lg max-w-2xl">Manage your uploaded documents and evidence artifacts.</p>
                </div>

                {/* Evidence Stats Badges */}
                <div className="hidden xl:flex items-center gap-10">
                  {[
                    { label: 'Total_Archive', value: evidenceStatus?.documentsCount || documents.length, icon: Database },
                    { label: 'Ingestion_Active', value: evidenceStatus?.processingCount || 0, icon: RefreshCw, pulse: (evidenceStatus?.processingCount || 0) > 0 }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 pl-8 border-l border-white/5 first:border-0 first:pl-0">
                      <span className="text-[9px] font-sans font-bold text-white/20 tracking-tight uppercase">{stat.label}</span>
                      <div className="flex items-center gap-3">
                        <stat.icon className={cn("h-3 w-3", stat.pulse ? "text-emerald-500 animate-spin" : "text-white/20")} />
                        <span className="text-lg font-sans font-bold text-white tracking-tight">
                          {stat.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl p-6">
                  <GmailConnectionStatus onStatusChange={setGmailConnected} />
                </div>
                <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl p-6">
                  <EvidenceIngestion
                    gmailConnected={gmailConnected}
                    onLogEvent={(event, delayMs) => addDocLog(event, delayMs)}
                    onIngestionComplete={() => {
                      // Refresh documents after ingestion
                      api.getDocuments().then(res => {
                        if (res.ok && Array.isArray(res.data)) {
                          setDocuments(res.data);
                        }
                      });
                      api.getEvidenceStatus(activeSlug).then(res => {
                        if (res.ok && res.data) {
                          setEvidenceStatus(res.data);
                        }
                      });
                    }}
                  />
                </div>
              </div>

              {/* Forensic Ingestion Terminal */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl mb-8 relative">
                {/* Terminal Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-3 w-3 text-emerald-500/50" />
                    <h2 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Activity Log</h2>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-[9px] font-sans font-bold text-white/20 hover:text-white/40 cursor-pointer transition-colors uppercase tracking-tight">
                      <input
                        type="checkbox"
                        checked={showDevLogs}
                        onChange={(e) => setShowDevLogs(e.target.checked)}
                        className="w-2.5 h-2.5 rounded border-white/10 bg-transparent text-emerald-500 focus:ring-0"
                      />
                      Detailed Logs
                    </label>
                    <span className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-tight">{filteredDocLogs.length} entries</span>
                  </div>
                </div>

                <div className="p-8">
                  {/* Terminal Search */}
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <span className="text-emerald-500/40 text-[10px] font-sans font-bold">$</span>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search activity..."
                      value={docLogSearch}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-8 h-10 text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 focus:border-emerald-500/30 rounded-lg tracking-tight"
                    />
                  </div>

                  {/* Terminal Logs */}
                  <div
                    ref={docLogContainerRef}
                    className="bg-black/40 border border-white/5 rounded-lg p-6 font-sans font-bold text-[10px] h-60 overflow-y-auto scrollbar-hide space-y-2 relative tracking-tight">
                    {/* Shadow overlay for depth */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/20" />

                    {filteredDocLogs.length === 0 ? (
                      <div className="text-white/10 flex items-center justify-center h-full gap-3">
                        <Loader2 className="h-3 w-3 animate-spin opacity-20" />
                        <span className="uppercase tracking-tight">Initializing...</span>
                      </div>
                    ) : (
                      <div className="relative space-y-1.5">
                        {filteredDocLogs.map((log) => (
                          <div key={log.id} className="flex flex-col group/log">
                            <div className="flex items-start gap-4 hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded transition-colors">
                              <span className="text-white/10 shrink-0 select-none tabular-nums group-hover/log:text-white/20 transition-colors">
                                [{log.timestamp.toLocaleTimeString()}]
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <Shield className="h-2.5 w-2.5 text-emerald-500/30" />
                                <span className="text-emerald-500/60 font-bold uppercase tracking-tight">System</span>
                              </div>
                              <span className={cn("flex-1 break-words leading-relaxed", getDocLogColor(log.type))}>
                                <span className="mr-2 opacity-50">{">>"}</span>
                                {showDevLogs ? log.message : (log.storyMessage || log.message)}

                                {!showDevLogs && log.moneyImpact && log.moneyImpact > 0 && (
                                  <span className="ml-2 text-emerald-500 bg-emerald-500/10 px-1 border border-emerald-500/20 rounded-sm font-bold">
                                    +${log.moneyImpact.toLocaleString()}
                                  </span>
                                )}
                                {!showDevLogs && log.claimsAffected && log.claimsAffected > 0 && (
                                  <span className="ml-2 text-white/30 border-l border-white/10 pl-2">
                                    {log.claimsAffected} claims
                                  </span>
                                )}
                              </span>
                            </div>
                            {log.thinkingDuration && showDevLogs && (
                              <div className="ml-14 mb-1">
                                <span className="text-[9px] text-white/10 italic font-sans font-light tracking-tight">
                                  Duration: {log.thinkingDuration}ms
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {loading && (
                          <div className="flex items-center gap-4 text-emerald-500/40 animate-pulse mt-1 px-1">
                            <span className="text-white/10 shrink-0 select-none tabular-nums">[{new Date().toLocaleTimeString()}]</span>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              <span className="font-bold uppercase tracking-tight">Scanning documents...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ingestion Node - Dropzone */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl mb-12 relative p-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-emerald-500/30 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-500/30 rounded-tr-xl" />

                <div
                  className={cn(
                    "border border-dashed transition-all duration-300 rounded-xl p-12 text-center group relative overflow-hidden",
                    dragActive ? "border-emerald-500/50 bg-emerald-500/[0.02]" : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                  )}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                >
                  <div className="absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <Cloud className={cn("h-10 w-10 mx-auto mb-6 transition-all duration-300", dragActive ? "scale-110 text-emerald-500" : "text-white/10 group-hover:text-white/20")} />
                  <h3 className="text-sm font-sans font-bold text-white mb-2 uppercase tracking-tight">Document Ingestion</h3>
                  <p className="text-[10px] text-white/20 font-sans font-bold mb-8 uppercase tracking-tight">
                    Supported types: PDF, JPG, PNG
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      className="group relative px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 transition-all rounded-lg overflow-hidden"
                      onClick={() => document.getElementById('doc-file-input')?.click()}
                    >
                      <div className="relative flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-black" />
                        <span className="text-[11px] font-sans font-bold text-black uppercase tracking-tight">Upload Files</span>
                      </div>
                    </button>
                    <input id="doc-file-input" type="file" multiple className="hidden" onChange={(e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      handleFileUpload(files);
                      e.target.value = '';
                    }} />

                    <div className="flex items-center gap-6 pl-4 border-l border-white/5">
                      <div className="flex items-center gap-2 text-white/20">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-tight">store@invoices.margin.app</span>
                      </div>
                      <Link to="/integrations-hub" className="text-[10px] font-sans font-bold text-emerald-500/50 hover:text-emerald-500 uppercase tracking-tight transition-colors">
                        Connect sources {">>"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Registry Ledger - Document Library */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                {/* Ledger Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h2 className="text-[11px] font-sans font-bold text-white/40 uppercase tracking-tight">Document Library</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm font-sans font-bold text-white tracking-tight uppercase">{sorted.length} documents</span>
                      <div className="h-1.5 w-[1px] bg-white/10" />
                      <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-tight">AI Analysis Enabled</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group/search">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within/search:text-white transition-colors" />
                      <Input
                        placeholder="Search documents..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="h-9 w-64 bg-white/[0.03] border-white/10 text-[11px] font-sans font-bold pl-9 focus:border-emerald-500/30 transition-all rounded-lg placeholder:text-white/10 tracking-tight"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4 text-[10px] font-sans font-bold text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all uppercase tracking-tight rounded-lg"
                      onClick={exportCsv}
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      EXPORT
                    </Button>

                    {documents.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 text-[10px] font-sans font-bold text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 transition-all uppercase tracking-tight rounded-lg"
                        onClick={handleDeleteAllDocuments}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ledger Body */}
                <div className="flex flex-col min-h-[500px]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                      <div className="relative flex h-4 w-4 mb-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500/40"></span>
                      </div>
                      <span className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight">Loading documents...</span>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-rose-500/[0.02]">
                      <AlertCircle className="h-8 w-8 text-rose-500/20 mb-6" />
                      <span className="text-[11px] font-sans font-bold text-rose-500 uppercase tracking-tight">Connection error</span>
                      <p className="text-[10px] text-rose-500/40 mt-2 font-sans font-bold tracking-tight">{error}</p>
                      <Button
                        variant="ghost"
                        className="mt-8 text-[11px] font-sans font-bold text-white/20 hover:text-white tracking-tight"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-white/5 overflow-hidden">
                        {pageData.map((doc) => (
                          <div
                            key={doc.id}
                            className="group relative flex items-center justify-between py-6 px-8 hover:bg-white/[0.02] transition-all duration-300"
                          >
                            <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start gap-6 flex-1 pr-12">
                              <div className="mt-1.5 flex flex-col items-center gap-3">
                                <Checkbox
                                  checked={selectedIds.has(doc.id)}
                                  onCheckedChange={(c) => {
                                    setSelectedIds(prev => {
                                      const next = new Set(prev);
                                      if (c) next.add(doc.id); else next.delete(doc.id);
                                      return next;
                                    });
                                  }}
                                  className="h-3.5 w-3.5 border-white/20 rounded-sm data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none transition-colors"
                                />
                                <Hexagon className="h-3.5 w-3.5 text-white/5 group-hover:text-emerald-500/50 transition-colors" />
                              </div>

                              <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-white tracking-tight truncate uppercase group-hover:text-emerald-500/80 transition-colors">
                                    {doc.name}
                                  </span>
                                  {doc.matchedClaims && doc.matchedClaims.length > 0 && (
                                    <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-sans font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-1.5">
                                      <Link2 className="h-2.5 w-2.5" />
                                      {doc.matchedClaims.length} linked claims
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center text-[10px] font-sans font-bold text-white/20 gap-4 uppercase tracking-tight">
                                  <span className="text-white/40">{doc.supplier || "Vendor unknown"}</span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">{doc.invoice || "No reference"}</span>
                                  <span className="text-white/5">|</span>
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                      doc.parser_status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                        doc.parser_status === 'processing' ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' :
                                          doc.parser_status === 'failed' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-white/10'
                                    )} />
                                    <span className={cn(
                                      doc.parser_status === 'completed' ? 'text-emerald-500/60' :
                                        doc.parser_status === 'failed' ? 'text-rose-500/60' : 'text-white/20'
                                    )}>
                                      {doc.parser_status || "Pending"}
                                    </span>
                                  </div>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">
                                    {doc.parser_confidence !== undefined ? `${(doc.parser_confidence * 100).toFixed(0)}%_CONF` : "CONF_TBD"}
                                  </span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white font-bold">
                                    {typeof doc.amount === 'number' ? `$${doc.amount.toFixed(2)}` : "—"}
                                  </span>
                                  <span className="text-white/5">|</span>
                                  <span className="tabular-nums">
                                    {new Date(doc.uploadDate).toLocaleDateString('en-CA')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {doc.matchedClaims && doc.matchedClaims.length > 0 && (
                                <Link
                                  to={`/case/${doc.matchedClaims[0]}`}
                                  className="text-[10px] font-sans font-bold text-white/20 hover:text-emerald-500 transition-colors uppercase tracking-tight flex items-center gap-2"
                                >
                                  ID_{doc.matchedClaims[0].slice(0, 8)}
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/10 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-3xl backdrop-blur-3xl p-2 animate-in fade-in slide-in-from-top-1">
                                  <DropdownMenuItem asChild className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white rounded-lg cursor-pointer px-4 py-2.5 uppercase tracking-tight">
                                    <Link to={`/app/${activeSlug}/documents/${encodeURIComponent(doc.id)}`} className="flex items-center gap-3">
                                      <Eye className="w-3.5 h-3.5" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => downloadDoc(doc.id)}
                                    className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white rounded-lg cursor-pointer px-4 py-2.5 uppercase tracking-tight"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-3" />
                                    Download
                                  </DropdownMenuItem>
                                  <div className="h-[1px] bg-white/5 my-2" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                    className="text-[11px] font-sans font-bold text-rose-500/60 focus:bg-rose-500/10 focus:text-rose-500 rounded-lg cursor-pointer px-4 py-2.5 uppercase tracking-tight"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-3" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Ledger Pagination */}
                      <div className="px-8 py-6 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedIds.size > 0 && selectedIds.size === pageData.length}
                              onCheckedChange={(c) => {
                                if (c) setSelectedIds(new Set(pageData.map(d => d.id)));
                                else setSelectedIds(new Set());
                              }}
                              className="h-3 w-3 border-white/10 rounded-sm"
                            />
                            <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Selection</span>
                          </div>
                          <span className="text-white/5 h-3 w-[1px]" />
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">
                            PAGE {page} OF {totalPages}
                          </span>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Page size</span>
                            <select
                              className="bg-transparent border-none text-[10px] font-sans font-bold text-white/60 focus:ring-0 cursor-pointer p-0 uppercase"
                              value={pageSize}
                              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            >
                              <option value={10}>10 records</option>
                              <option value={20}>20 records</option>
                              <option value={50}>50 records</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="h-9 px-4 text-[10px] font-sans font-bold text-white/20 hover:text-white border border-white/5 rounded-lg disabled:opacity-10 tracking-tight"
                              disabled={page <= 1}
                              onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                              PREVIOUS
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-9 px-4 text-[10px] font-sans font-bold text-white/20 hover:text-white border border-white/5 rounded-lg disabled:opacity-10 tracking-tight"
                              disabled={page >= totalPages}
                              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                              NEXT_CYCLE
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
