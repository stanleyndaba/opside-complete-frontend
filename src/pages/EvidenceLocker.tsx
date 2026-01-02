import React, { useEffect, useMemo, useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Search, Mail, Check, AlertTriangle, Clock, Eye, Download, ExternalLink, Loader2, FolderSearch, ScanLine, FileCheck, Link2, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
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

// Get log color
const getDocLogColor = (type: DocLogEntry['type']) => {
  switch (type) {
    case 'success': return 'text-emerald-400';
    case 'error': return 'text-red-400';
    case 'warning': return 'text-amber-400';
    case 'progress': return 'text-blue-400';
    case 'thinking': return 'text-gray-500 italic';
    default: return 'text-gray-300';
  }
};

// Format timestamp
const formatDocTimestamp = (date: Date) => {
  return date.toISOString().replace('T', ' ').slice(0, 23);
};
export default function EvidenceLocker() {
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
    addDocLog({ type: 'info', category: 'system', message: 'Doc Locker initialized...', thinkingDuration: 2 }, 0);
    addDocLog({ type: 'thinking', category: 'system', message: 'Ready to process invoices, receipts, and purchase orders' }, 1200);
    addDocLog({ type: 'info', category: 'system', message: 'Waiting for documents to analyze...' }, 1000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Fetch documents and evidence status
    (async () => {
      setLoading(true);
      const [docRes, statusRes, gmailRes] = await Promise.all([
        api.getDocuments(),
        api.getEvidenceStatus(),
        api.getGmailStatus(),
      ]);

      if (!cancelled) {
        if (docRes.ok && Array.isArray(docRes.data)) {
          // Enhance documents with parsed data and matching results
          const enhancedDocs = await Promise.all(
            docRes.data.map(async (doc: any) => {
              let enhancedDoc = { ...doc };

              // Try to get parsed data for each document
              try {
                const parsedRes = await api.getDocumentWithParsedData(doc.id);
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
                const matchRes = await api.getDocumentMatchingResults(doc.id);
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
    try {
      es = new EventSource('/api/sse/status');
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'evidence' && evt?.status === 'completed') {
            const story = generateStoryMessage('gmail_scan', { source: 'Gmail', count: evt.count || 1, matched: evt.matched || 0, unmatched: evt.unmatched || 0 });
            addDocLog({ type: 'success', category: 'system', message: '[INGESTION] New documents available', storyMessage: story.story, claimsAffected: story.claims }, 500);
            toast({ title: 'Ingestion complete', description: 'New documents are available.' });
            // Refresh documents
            api.getDocuments().then(res => {
              if (res.ok && Array.isArray(res.data)) {
                setDocuments(res.data);
              }
            });
          }
          if (evt?.type === 'parsing' && evt?.status === 'completed') {
            const parseStory = generateStoryMessage('invoice_parsed', { lineItems: evt.lineItems || 0, claimsLinked: evt.claimsLinked || 0, supplier: evt.supplier });
            addDocLog({ type: 'success', category: 'parse', message: `[PARSED] Document parsing complete`, storyMessage: parseStory.story, claimsAffected: parseStory.claims }, 600);
            addDocLog({ type: 'thinking', category: 'match', message: 'Checking for claim matches...', storyMessage: '🔍 Analyzing document for matching claims...' }, 900);
            // Refresh document with parsed data
            if (evt?.document_id) {
              api.getDocumentWithParsedData(evt.document_id).then(res => {
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
              api.runEvidenceMatching().then(matchRes => {
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
            addDocLog({ type: 'success', category: 'match', message: `[MATCHED] Found ${matches} claim-document match(es)`, storyMessage: matchStory.story, moneyImpact: matchStory.money, claimsAffected: matchStory.claims }, 600);

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
            api.getDocuments().then(res => {
              if (res.ok && Array.isArray(res.data)) {
                // Fetch matching results for each document to populate matchedClaims
                Promise.all(
                  res.data.map(async (doc: any) => {
                    try {
                      const matchRes = await api.getDocumentMatchingResults(doc.id);
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
              message: `[MATCHING] Analyzing ${evt.documentCount || 0} document(s) for claim matches...`
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

            addDocLog({ type: 'success', category: 'match', message: `[MATCHED] Found ${matches} claim-document match(es)` }, 600);

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
            api.getDocuments().then(res => {
              if (res.ok && Array.isArray(res.data)) {
                // Fetch matching results for each document to populate matchedClaims
                Promise.all(
                  res.data.map(async (doc: any) => {
                    try {
                      const matchRes = await api.getDocumentMatchingResults(doc.id);
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
  }, []);
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
    if (!files.length) {
      toast({
        title: 'No files',
        description: 'Please drop valid files to upload.',
        variant: 'destructive'
      });
      addDocLog({ type: 'warning', category: 'upload', message: 'No files detected in drop' }, 0);
      return;
    }

    // Add upload logs
    addDocLog({ type: 'info', category: 'upload', message: `Receiving ${files.length} document(s)...`, thinkingDuration: 2 }, 0);
    addDocLog({ type: 'thinking', category: 'upload', message: `Let me process: ${files.map(f => f.name).join(', ')}` }, 800);

    // Show immediate feedback
    toast({
      title: 'Uploading...',
      description: `Uploading ${files.length} document(s)...`
    });

    try {
      setLoading(true);
      // Try /api/documents/upload first, fallback to /api/evidence/upload
      const uploadUrls = [
        api.buildApiUrl('/api/documents/upload'),
        api.buildApiUrl('/api/evidence/upload')
      ];

      console.log('[Upload] Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

      let lastError: Error | null = null;
      let res: Response | null = null;
      let successfulUrl: string | null = null;

      // Try both endpoints - recreate FormData for each attempt
      for (const uploadUrl of uploadUrls) {
        try {
          // Recreate FormData for each endpoint attempt (FormData is consumed after fetch)
          const form = new FormData();
          // OpenAPI spec shows 'file' (singular) - append all files with 'file' field name
          for (const f of files) {
            form.append('file', f);
          }

          console.log('[Upload] Trying endpoint:', uploadUrl);
          console.log('[Upload] FormData entries:', Array.from(form.entries()).map(([key, value]) => ({ key, value: value instanceof File ? value.name : value })));

          res = await fetch(uploadUrl, {
            method: 'POST',
            credentials: 'include',
            body: form
          });

          console.log('[Upload] Response status:', res.status, res.statusText, 'from', uploadUrl);

          if (res.ok) {
            console.log('[Upload] Success from endpoint:', uploadUrl);
            successfulUrl = uploadUrl;
            break;
          } else {
            const errorText = await res.text();
            console.warn('[Upload] Failed on', uploadUrl, ':', res.status, errorText);
            lastError = new Error(`Upload failed on ${uploadUrl}: ${res.status} ${res.statusText} - ${errorText}`);
            // Continue to next endpoint
          }
        } catch (err: any) {
          console.warn('[Upload] Error on', uploadUrl, ':', err);
          lastError = err;
          // Continue to next endpoint
        }
      }

      if (!res || !res.ok) {
        const errorText = res ? await res.text().catch(() => 'Unknown error') : 'No response from server';
        console.error('[Upload] All endpoints failed. Last error:', lastError);
        console.error('[Upload] Last response:', res ? { status: res.status, statusText: res.statusText, body: errorText } : 'No response');

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || lastError?.message || `Upload failed. Check console for details.` };
        }
        throw new Error(errorData.message || errorData.error || `Upload failed. Please check if the backend endpoint is available. Endpoints tried: ${uploadUrls.join(', ')}`);
      }

      const responseData = await res.json().catch(() => null);
      console.log('[Upload] Success response from', successfulUrl, ':', responseData);

      // Add success logs
      addDocLog({ type: 'success', category: 'upload', message: `[UPLOADED] ${files.length} document(s) received` }, 600);
      addDocLog({ type: 'thinking', category: 'parse', message: 'Now let me extract text and metadata...' }, 900);
      addDocLog({ type: 'progress', category: 'parse', message: 'Running OCR and text extraction...', thinkingDuration: 3 }, 1200);

      // Show success toast
      toast({
        title: 'Uploaded Successfully',
        description: `${files.length} document(s) uploaded successfully. Parsing will begin automatically.`,
        duration: 5000
      });

      // Refresh documents list
      const refresh = await api.getDocuments();
      if (refresh.ok && Array.isArray(refresh.data)) {
        setDocuments(refresh.data);
        // Show toast if new documents were added
        if (refresh.data.length > documents.length) {
          const newCount = refresh.data.length - documents.length;
          addDocLog({ type: 'success', category: 'parse', message: `[PARSED] ${newCount} document(s) added to library` }, 1500);
          addDocLog({ type: 'thinking', category: 'match', message: 'I\'ll look for matches with your open claims...' }, 1100);
          addDocLog({ type: 'info', category: 'match', message: 'Cross-referencing invoice numbers and amounts...', thinkingDuration: 4 }, 1300);
          toast({
            title: 'Documents Added',
            description: `${newCount} new document(s) are now in your Doc Locker.`,
            duration: 4000
          });
        }
      }

      // Refresh evidence status
      const statusRes = await api.getEvidenceStatus();
      if (statusRes.ok && statusRes.data) {
        setEvidenceStatus(statusRes.data);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      addDocLog({ type: 'error', category: 'upload', message: `Upload failed: ${err?.message || 'Unknown error'}` }, 0);

      // Show user-friendly error toast instead of raw error
      const errorMessage = err?.message?.toLowerCase() || '';
      if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
        toast({
          title: 'Connection Issue',
          description: "We couldn't reach the server. Please check your internet and try again.",
          variant: 'destructive',
          duration: 5000
        });
      } else if (errorMessage.includes('too large') || errorMessage.includes('size')) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files under 25MB.',
          variant: 'destructive',
          duration: 5000
        });
      } else if (errorMessage.includes('format') || errorMessage.includes('type')) {
        toast({
          title: 'Unsupported Format',
          description: 'Please upload PDF, PNG, or JPG files.',
          variant: 'destructive',
          duration: 5000
        });
      } else {
        toast({
          title: 'Upload Issue',
          description: "We couldn't upload your file. Please try again or contact support.",
          variant: 'destructive',
          duration: 5000
        });
      }
    } finally {
      setLoading(false);
    }
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
      const response = await api.getDocumentDownload(id);
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
      const res = await api.deleteDocument(docId);
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
      const res = await api.deleteAllDocuments();
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

  return <PageLayout title="Doc Locker">
    <div className="relative -m-4 lg:-m-6 overflow-x-hidden">
      <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
        <div className="relative w-full max-w-full mx-auto px-8 pt-8 pb-10 text-gray-900">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-gray-900 tracking-tight">Evidence Locker</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">Document Management</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GmailConnectionStatus onStatusChange={setGmailConnected} />
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
                api.getEvidenceStatus().then(res => {
                  if (res.ok && res.data) {
                    setEvidenceStatus(res.data);
                  }
                });
              }}
            />
          </div>

          {/* Document Activity Log */}
          <div className="bg-white border border-gray-200 rounded-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Document Activity</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Real-time document processing log</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[10px] text-gray-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDevLogs}
                    onChange={(e) => setShowDevLogs(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  Dev Logs
                </label>
                <span className="text-[10px] text-gray-400">{filteredDocLogs.length} entries</span>
              </div>
            </div>
            <div className="p-6">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search logs... (upload, parse, match)"
                  value={docLogSearch}
                  onChange={(e) => setDocLogSearch(e.target.value)}
                  className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              {/* Log Container - Terminal Style */}
              <div
                ref={docLogContainerRef}
                className="bg-[#1f1f1f] rounded-lg p-4 font-mono text-xs h-48 overflow-y-auto scroll-smooth"
              >
                {filteredDocLogs.length === 0 ? (
                  <div className="text-gray-500 flex items-center justify-center h-full">
                    {docLogs.length === 0 ? 'Waiting for document activity...' : 'No logs match your search'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredDocLogs.map((log) => (
                      <div key={log.id} className="flex flex-col">
                        <div className={`flex flex-wrap sm:flex-nowrap items-start gap-1 sm:gap-2 hover:bg-gray-800/50 px-1 rounded ${log.type === 'thinking' ? 'opacity-70' : ''}`}>
                          <span className="hidden sm:inline text-gray-500 shrink-0 select-none">
                            {formatDocTimestamp(log.timestamp)}
                          </span>
                          <span className="sm:hidden text-gray-500 shrink-0 select-none text-[10px]">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className="text-cyan-500 shrink-0 select-none font-medium text-[10px] sm:text-xs">
                            doc agent
                          </span>
                          <span className={`shrink-0 ${getDocLogColor(log.type)}`}>
                            {log.type === 'thinking' ? null : getDocCategoryIcon(log.category)}
                          </span>
                          <span className={`${getDocLogColor(log.type)} break-words min-w-0 flex-1`}>
                            {/* Show story message by default, dev message when toggled */}
                            {showDevLogs ? log.message : (log.storyMessage || log.message)}
                            {/* Inline money badge */}
                            {!showDevLogs && log.moneyImpact && log.moneyImpact > 0 && (
                              <span className="ml-1.5 text-emerald-400 font-medium">+${log.moneyImpact.toLocaleString()}</span>
                            )}
                            {/* Inline claims badge */}
                            {!showDevLogs && log.claimsAffected && log.claimsAffected > 0 && (
                              <span className="ml-1 text-blue-400">({log.claimsAffected} claim{log.claimsAffected !== 1 ? 's' : ''})</span>
                            )}
                          </span>
                        </div>
                        {log.thinkingDuration && (
                          <div className="ml-1 mt-0.5 mb-1">
                            <span className="text-[10px] text-gray-600 italic">
                              Thought for {log.thinkingDuration}s
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 text-blue-400 animate-pulse">
                        <span className="hidden sm:inline text-gray-500 shrink-0 select-none">
                          {formatDocTimestamp(new Date())}
                        </span>
                        <span className="text-cyan-500 shrink-0 select-none font-medium text-[10px] sm:text-xs">
                          doc agent
                        </span>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload Documents */}
          <div className="bg-white border border-gray-200 rounded-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
              <div>
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Upload Documents</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Invoices, purchase orders, and receipts</p>
              </div>
              <p className="text-[9px] text-gray-500 font-medium whitespace-nowrap uppercase tracking-[0.1em]">
                82% of claims rejected without invoice
              </p>
            </div>
            <div className="p-6">
              <div className={`border border-dashed rounded-sm p-6 text-center transition-all ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <Upload className="h-6 w-6 mx-auto mb-3 text-gray-400" />
                <h3 className="text-xs font-medium text-gray-900 mb-1">Drag & Drop Documents</h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  PDF, JPG, PNG up to 10MB
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button className="px-4 py-2 text-xs text-white bg-gray-900 hover:bg-gray-800 transition-colors" onClick={() => document.getElementById('doc-file-input')?.click()}>
                    <Upload className="w-3 h-3 mr-1.5 inline" />
                    Browse Files
                  </button>
                  <input id="doc-file-input" type="file" multiple className="hidden" onChange={async (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (!files.length) {
                      toast({
                        title: 'No files',
                        description: 'Please select valid files to upload.',
                        variant: 'destructive'
                      });
                      addDocLog({ type: 'warning', category: 'upload', message: 'No files selected' }, 0);
                      return;
                    }

                    // Add upload logs
                    addDocLog({ type: 'info', category: 'upload', message: `Receiving ${files.length} document(s)...`, thinkingDuration: 2 }, 0);
                    addDocLog({ type: 'thinking', category: 'upload', message: `Processing: ${files.map(f => f.name).slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}` }, 800);

                    // Show immediate feedback
                    toast({
                      title: 'Uploading...',
                      description: `Uploading ${files.length} document(s)...`
                    });

                    try {
                      setLoading(true);
                      // Try /api/documents/upload first, fallback to /api/evidence/upload
                      const uploadUrls = [
                        api.buildApiUrl('/api/documents/upload'),
                        api.buildApiUrl('/api/evidence/upload')
                      ];

                      console.log('[Upload] Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));

                      let lastError: Error | null = null;
                      let res: Response | null = null;
                      let successfulUrl: string | null = null;

                      // Try both endpoints - recreate FormData for each attempt
                      for (const uploadUrl of uploadUrls) {
                        try {
                          // Recreate FormData for each endpoint attempt (FormData is consumed after fetch)
                          const form = new FormData();
                          // OpenAPI spec shows 'file' (singular) - append all files with 'file' field name
                          for (const f of files) {
                            form.append('file', f);
                          }

                          console.log('[Upload] Trying endpoint:', uploadUrl);
                          console.log('[Upload] FormData entries:', Array.from(form.entries()).map(([key, value]) => ({ key, value: value instanceof File ? value.name : value })));

                          res = await fetch(uploadUrl, {
                            method: 'POST',
                            credentials: 'include',
                            body: form
                          });

                          console.log('[Upload] Response status:', res.status, res.statusText, 'from', uploadUrl);

                          if (res.ok) {
                            console.log('[Upload] Success from endpoint:', uploadUrl);
                            successfulUrl = uploadUrl;
                            break;
                          } else {
                            const errorText = await res.text();
                            console.warn('[Upload] Failed on', uploadUrl, ':', res.status, errorText);
                            lastError = new Error(`Upload failed on ${uploadUrl}: ${res.status} ${res.statusText} - ${errorText}`);
                            // Continue to next endpoint
                          }
                        } catch (err: any) {
                          console.warn('[Upload] Error on', uploadUrl, ':', err);
                          lastError = err;
                          // Continue to next endpoint
                        }
                      }

                      if (!res || !res.ok) {
                        const errorText = res ? await res.text().catch(() => 'Unknown error') : 'No response from server';
                        console.error('[Upload] All endpoints failed. Last error:', lastError);
                        console.error('[Upload] Last response:', res ? { status: res.status, statusText: res.statusText, body: errorText } : 'No response');

                        let errorData;
                        try {
                          errorData = JSON.parse(errorText);
                        } catch {
                          errorData = { message: errorText || lastError?.message || `Upload failed. Check console for details.` };
                        }
                        throw new Error(errorData.message || errorData.error || `Upload failed. Please check if the backend endpoint is available. Endpoints tried: ${uploadUrls.join(', ')}`);
                      }

                      const responseData = await res.json().catch(() => null);
                      console.log('[Upload] Success response from', successfulUrl, ':', responseData);

                      // Add success logs
                      addDocLog({ type: 'success', category: 'upload', message: `[UPLOADED] ${files.length} document(s) received` }, 600);
                      addDocLog({ type: 'thinking', category: 'parse', message: 'Now let me extract text and metadata...' }, 900);
                      addDocLog({ type: 'progress', category: 'parse', message: 'Running OCR and text extraction...', thinkingDuration: 3 }, 1200);

                      // Show success toast
                      toast({
                        title: 'Uploaded Successfully',
                        description: `${files.length} document(s) uploaded successfully. Parsing will begin automatically.`,
                        duration: 5000
                      });

                      // Refresh documents list
                      const refresh = await api.getDocuments();
                      if (refresh.ok && Array.isArray(refresh.data)) {
                        const previousCount = documents.length;
                        setDocuments(refresh.data);
                        // Show toast if new documents were added
                        if (refresh.data.length > previousCount) {
                          const newCount = refresh.data.length - previousCount;
                          addDocLog({ type: 'success', category: 'parse', message: `[PARSED] ${newCount} document(s) added to library` }, 1500);
                          addDocLog({ type: 'thinking', category: 'match', message: 'I\'ll look for matches with your open claims...' }, 1100);
                          addDocLog({ type: 'info', category: 'match', message: 'Cross-referencing invoice numbers and amounts...', thinkingDuration: 4 }, 1300);
                          toast({
                            title: 'Documents Added',
                            description: `${newCount} new document(s) are now in your Doc Locker.`,
                            duration: 4000
                          });
                        }
                      }

                      // Refresh evidence status
                      const statusRes = await api.getEvidenceStatus();
                      if (statusRes.ok && statusRes.data) {
                        setEvidenceStatus(statusRes.data);
                      }

                      // Reset file input
                      e.target.value = '';
                    } catch (err: any) {
                      console.error('Upload error:', err);
                      addDocLog({ type: 'error', category: 'upload', message: `Upload failed: ${err?.message || 'Unknown error'}` }, 0);
                      toast({
                        title: 'Upload Failed',
                        description: err?.message || 'Failed to upload documents. Please try again.',
                        variant: 'destructive',
                        duration: 5000
                      });
                    } finally {
                      setLoading(false);
                    }
                  }} />

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5" />
                    <span>or email to:</span>
                    <code className="bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-900">
                      store@invoices.opside.ai
                    </code>
                    <Link to="/integrations-hub" className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs">
                      Connect Sources <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={exportCsv}>Export CSV</Button>
                  {documents.length > 0 && (
                    <Button
                      variant="outline"
                      className="bg-white text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleDeleteAllDocuments}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  )}
                  <div className="text-[10px] text-gray-600 ml-2">{selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Library */}
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-0.5">Document Library</h2>
              <p className="text-[10px] text-gray-500 mb-3">All uploaded evidence documents</p>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 stroke-[2]" />
                  <Input placeholder="Search ASIN, SKU, tracking #, invoice…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-80 h-8 text-xs border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 rounded-sm" />
                  {q && (
                    <button
                      onClick={() => setQ('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-40 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
                <Input placeholder="Type (invoice/receipt/shipping)" value={type} onChange={(e) => setType(e.target.value)} className="w-56 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
                <Input placeholder="Amount min" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="w-28 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
                <Input placeholder="Amount max" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="w-28 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading && <div className="text-xs text-gray-500">Loading documents…</div>}
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader className="border-b border-gray-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-gray-400 whitespace-nowrap py-3 border-b border-gray-200">
                      <Checkbox checked={selectedIds.size > 0 && selectedIds.size === pageData.length} onCheckedChange={(c) => {
                        if (c) setSelectedIds(new Set(pageData.map(d => d.id))); else setSelectedIds(new Set());
                      }} />
                    </TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('name')}>Document Name</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('supplier')}>Supplier</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('invoice')}>Invoice #</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('uploadDate')}>Upload Date</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('parser_status')}>Status</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('amount')}>Amount</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap cursor-pointer py-3 border-b border-gray-200" onClick={() => toggleSort('matchedClaims')}>Linked Claims</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] whitespace-nowrap py-3 border-b border-gray-200"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map(doc => <TableRow key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="whitespace-nowrap py-3">
                      <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={(c) => {
                        setSelectedIds(prev => { const next = new Set(prev); if (c) next.add(doc.id); else next.delete(doc.id); return next; });
                      }} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-gray-300" />
                        <span className="text-sm text-gray-900">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-sm text-gray-600">{doc.supplier || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-sm font-mono text-gray-600">{doc.invoice || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-sm font-mono tabular-nums text-gray-600">
                      {new Date(doc.uploadDate).toLocaleDateString('en-CA')}
                    </TableCell>

                    {/* Status - Institutional: plain text, no badges */}
                    <TableCell className="whitespace-nowrap py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono ${doc.parser_status === 'completed' ? 'text-gray-900' :
                          doc.parser_status === 'processing' ? 'text-gray-500' :
                            doc.parser_status === 'failed' ? 'text-red-600' :
                              'text-gray-400'
                          }`}>
                          {doc.parser_status === 'completed' ? 'Parsed' :
                            doc.parser_status === 'processing' ? 'Parsing' :
                              doc.parser_status === 'failed' ? 'Failed' :
                                doc.parser_status === 'pending' ? 'Pending' : '—'}
                        </span>
                        {doc.parser_confidence !== undefined && (
                          <span className="text-[10px] font-mono text-gray-400">
                            {(doc.parser_confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="whitespace-nowrap py-3 text-sm font-mono tabular-nums text-gray-900">{typeof doc.amount === 'number' ? `$${doc.amount.toFixed(2)}` : '—'}</TableCell>

                    {/* Linked Claims - Institutional: plain text links */}
                    <TableCell className="whitespace-nowrap py-3">
                      {(() => {
                        const claims = doc.matchedClaims || [];

                        if (claims.length === 0) {
                          return <span className="text-gray-400 text-xs">—</span>;
                        }

                        return (
                          <div className="flex flex-wrap gap-2 items-center">
                            {claims.slice(0, 2).map((id: string) => (
                              <Link
                                key={id}
                                to={`/case/${id}`}
                                className="text-xs font-mono text-gray-600 hover:text-gray-900 hover:underline"
                              >
                                {id.slice(0, 8)}
                              </Link>
                            ))}
                            {claims.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{claims.length - 2}</span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Actions - Institutional: subtle */}
                    <TableCell className="whitespace-nowrap py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem asChild>
                            <Link to={`/documents/${encodeURIComponent(doc.id)}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDoc(doc.id)} className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Download
                          </DropdownMenuItem>
                          {/* Claim Packet - only show if doc has matched claims */}
                          {doc.matchedClaims && doc.matchedClaims.length > 0 && (
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/recoveries/${doc.matchedClaims[0]}?evidence=true`}
                                className="flex items-center gap-2"
                                title={`View claim packet for ${doc.matchedClaims.length} linked claim(s)`}
                              >
                                <FileText className="w-4 h-4" />
                                View Claim Packet
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {doc.parser_status && doc.parser_status !== 'completed' && doc.parser_status !== 'processing' && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const res = await api.reparseDocument(doc.id);
                                  if (res.ok) {
                                    toast({ title: 'Parsing Started', description: 'Document parsing has been triggered.' });
                                    const parsedRes = await api.getDocumentWithParsedData(doc.id);
                                    if (parsedRes.ok && parsedRes.data) {
                                      setDocuments(prev => prev.map(d =>
                                        d.id === doc.id
                                          ? { ...d, parser_status: parsedRes.data!.parser_status }
                                          : d
                                      ));
                                    }
                                  } else {
                                    toast({ title: 'Parse Failed', description: res.error || 'Failed to trigger parsing.', variant: 'destructive' });
                                  }
                                } catch (error) {
                                  toast({ title: 'Parse Failed', description: 'An error occurred.', variant: 'destructive' });
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Parse
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>
            {pageData.length === 0 && !loading && (
              <div className="text-center text-sm text-[#36454F] py-6">No documents found. Try adjusting filters or <Link to="/integrations-hub" className="underline">connect evidence sources</Link>.</div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-[#36454F]">Page {page} of {totalPages} • {sorted.length} items</div>
              <div className="flex items-center gap-3">
                <select className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout >;
}
