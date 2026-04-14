import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Clock, Eye, Download, Trash2, MoreHorizontal, RefreshCw, Hexagon, AlertCircle, ArrowRight, Terminal, Database, Link2, FileWarning, CheckCircle2, CircleDashed, Cloud, Upload, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { getFrontendAuthContext } from '@/lib/authSession';
import { useStatusStream } from '@/hooks/use-status-stream';
import { Checkbox } from '@/components/ui/checkbox';
import { GmailConnectionStatus } from '@/components/evidence/GmailConnectionStatus';
import { EvidenceIngestion } from '@/components/evidence/EvidenceIngestion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatAutonomyLabel, getIngestionTruth, getParsingTruth, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
interface LockerDocumentRow {
  id: string;
  name: string;
  filename: string;
  original_filename?: string | null;
  created_at: string;
  updated_at?: string;
  uploadDate: string;
  status: string;
  processing_status?: string;
  parser_status?: string;
  parser_confidence?: number | null;
  parser_error?: string | null;
  parsing_strategy?: 'FULL' | 'PARTIAL' | 'FAILED_DURABLE' | null;
  parsing_explanation?: {
    reason?: string;
    completed_steps?: string[];
    failed_steps?: string[];
    preserved_outputs?: string[];
  } | null;
  ingestion_strategy?: 'FULL' | 'DEGRADED' | 'REJECTED' | null;
  ingestion_explanation?: {
    reason?: string;
    preserved_fields?: string[];
    missing_fields?: string[];
  } | null;
  extraction_signal_count?: number;
  source?: string | null;
  provider?: string | null;
  source_display?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  supplier?: string | null;
  invoice?: string | null;
  amount?: number | null;
  parsedVia?: string | null;
  parsed_metadata?: any;
  extracted?: any;
  linked_case_count: number;
  linked_case_ids: string[];
  linked_case_refs: string[];
  strongest_match_confidence?: number | null;
  strongest_match_type?: string | null;
  linkage_strength: 'none' | 'weak' | 'strong';
  evidence_state: string;
  usable_as_evidence: boolean;
  usability_reason: string;
  needs_review: boolean;
}

interface LockerAuditEvent {
  id: string;
  documentId: string;
  filename: string;
  eventType: string;
  timestamp: string;
  narrative: string;
}

type LiveLockerEvent = {
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  entityId?: string;
};

const getAuditEventColor = (eventType: string) => {
  switch (eventType) {
    case 'parsed':
    case 'verified':
      return 'text-white';
    case 'linked':
    case 'filed':
      return 'text-white/80';
    case 'error':
      return 'text-rose-500';
    default:
      return 'text-white/60';
  }
};

const formatBytes = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'Not available';
  }

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getEvidenceStateIcon = (state: string) => {
  switch (state) {
    case 'Usable':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'Parsing Failed':
      return <FileWarning className="h-3 w-3" />;
    case 'Linked Strongly':
    case 'Linked Weakly':
      return <Link2 className="h-3 w-3" />;
    default:
      return <CircleDashed className="h-3 w-3" />;
  }
};

const getEvidenceStateLabel = (doc: LockerDocumentRow) => {
  switch (doc.evidence_state) {
    case 'Usable':
      return 'Support confirmed';
    case 'Linked Strongly':
      return 'Linked, review';
    case 'Linked Weakly':
      return 'Linked weakly';
    case 'Unmatched':
      return 'Parsed, unlinked';
    case 'Not Parsed':
      return 'Stored';
    case 'Parsing Partial':
      return 'Parsed partial';
    default:
      return doc.evidence_state;
  }
};

const getEvidenceStateBadgeClass = (doc: LockerDocumentRow) => {
  if (doc.usable_as_evidence) {
    return 'bg-white/10 text-white/80 border-white/15';
  }

  switch (doc.evidence_state) {
    case 'Parsing Failed':
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'Parsing Partial':
    case 'Linked Weakly':
    case 'Linked Strongly':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Unmatched':
    case 'Not Parsed':
    default:
      return 'bg-white/5 text-white/55 border-white/10';
  }
};

const getLockerParsingStatus = (doc: LockerDocumentRow) => getParsingTruth(doc).status;

const getLockerParsingReason = (doc: LockerDocumentRow) =>
  getParsingTruth(doc).explanation?.reason ||
  summarizeOperationalExplanation(getParsingTruth(doc).operationalExplanation) ||
  doc.parser_error ||
  null;

const getLockerIngestionLabel = (doc: LockerDocumentRow) => {
  const truth = getIngestionTruth(doc);
  return truth.strategy ? formatAutonomyLabel(truth.strategy) : null;
};

function appendAuditEvent(
  current: LockerAuditEvent[],
  next: LockerAuditEvent
) {
  const withoutDuplicate = current.filter((event) => event.id !== next.id);
  return [next, ...withoutDuplicate].slice(0, 50);
}

function applyLockerEvent(doc: LockerDocumentRow, event: LiveLockerEvent): LockerDocumentRow {
  const documentId = String(event.data?.document_id || event.entityId || '').trim();
  if (!documentId || doc.id !== documentId) {
    return doc;
  }

  if (event.eventType === 'parsing_completed') {
    const parserStatus = String(event.data?.parser_status || '').trim().toLowerCase();
    const parsingStrategy = String(event.data?.parsing_strategy || '').trim().toUpperCase();
    const resolvedParserStatus = parserStatus || (parsingStrategy === 'PARTIAL' ? 'partial' : parsingStrategy === 'FAILED_DURABLE' ? 'failed' : 'completed');
    const nextEvidenceState =
      resolvedParserStatus === 'failed'
        ? 'Parsing Failed'
        : resolvedParserStatus === 'partial'
          ? 'Parsing Partial'
          : doc.linked_case_count > 0
            ? doc.evidence_state
            : 'Unmatched';
    return {
      ...doc,
      parser_status: resolvedParserStatus,
      parsing_strategy: parsingStrategy ? parsingStrategy as LockerDocumentRow['parsing_strategy'] : doc.parsing_strategy,
      parsing_explanation: event.data?.parsing_explanation || doc.parsing_explanation,
      status: resolvedParserStatus === 'failed' ? 'failed' : 'completed',
      processing_status: resolvedParserStatus === 'failed' ? 'failed' : 'completed',
      parser_confidence: typeof event.data?.parser_confidence === 'number' ? event.data.parser_confidence : doc.parser_confidence,
      parser_error: event.data?.parser_error || doc.parser_error,
      parsed_metadata: event.data?.parsed_metadata || doc.parsed_metadata,
      updated_at: event.timestamp,
      evidence_state: nextEvidenceState,
      usable_as_evidence: resolvedParserStatus === 'completed' ? doc.usable_as_evidence : false,
      needs_review: resolvedParserStatus !== 'completed' || doc.needs_review
    };
  }

  if (event.eventType === 'matching_completed' || event.eventType === 'evidence_matching_completed') {
    const match = Array.isArray(event.data?.results)
      ? event.data.results.find((result: any) => String(result?.document_id || '') === doc.id)
      : null;

    if (!match) {
      return doc;
    }

    const confidence = Number(match.confidence_score || 0);
    return {
      ...doc,
      strongest_match_confidence: Number.isFinite(confidence) ? confidence : doc.strongest_match_confidence,
      strongest_match_type: match.match_type || doc.strongest_match_type,
      linkage_strength: confidence >= 0.85 ? 'strong' : confidence > 0 ? 'weak' : doc.linkage_strength,
      updated_at: event.timestamp
    };
  }

  if (event.eventType === 'evidence.linked') {
    const caseId = String(event.data?.dispute_case_id || '').trim();
    const caseRef = String(event.data?.case_number || caseId).trim();
    const linkedCaseIds = caseId && !doc.linked_case_ids.includes(caseId)
      ? [caseId, ...doc.linked_case_ids]
      : doc.linked_case_ids;
    const linkedCaseRefs = caseRef && !doc.linked_case_refs.includes(caseRef)
      ? [caseRef, ...doc.linked_case_refs]
      : doc.linked_case_refs;
    const confidence = Number(event.data?.match_confidence || doc.strongest_match_confidence || 0);

    return {
      ...doc,
      linked_case_count: Math.max(doc.linked_case_count, linkedCaseIds.length, 1),
      linked_case_ids: linkedCaseIds,
      linked_case_refs: linkedCaseRefs,
      strongest_match_confidence: Number.isFinite(confidence) ? confidence : doc.strongest_match_confidence,
      strongest_match_type: event.data?.match_type || doc.strongest_match_type,
      linkage_strength: confidence >= 0.85 ? 'strong' : 'weak',
      evidence_state: confidence >= 0.85 ? 'Linked Strongly' : 'Linked Weakly',
      usable_as_evidence: true,
      updated_at: event.timestamp
    };
  }

  return doc;
}
export default function EvidenceLocker() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug;
  const urlQuery = (searchParams.get('q') || '').trim();
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);
  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const [dragActive, setDragActive] = useState(false);
  const [documents, setDocuments] = useState<LockerDocumentRow[]>([]);
  const [recentEvents, setRecentEvents] = useState<LockerAuditEvent[]>([]);
  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    filteredResults: 0,
    parsed: 0,
    matched: 0,
    failed: 0,
    needsReview: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [q, setQ] = useState('');
  const [docLogSearch, setDocLogSearch] = useState('');
  const [sortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalResults: 0
  });
  const { toast } = useToast();

  const docLogContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q !== urlQuery) {
      setQ(urlQuery);
      setPage(1);
    }
  }, [q, urlQuery]);

  useEffect(() => {
    const normalizedSearch = q.trim();
    const currentQuery = (searchParams.get('q') || '').trim();
    if (normalizedSearch === currentQuery) return;

    const nextParams = new URLSearchParams(searchParams);
    if (normalizedSearch) {
      nextParams.set('q', normalizedSearch);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  }, [q, searchParams, setSearchParams]);

  const refreshInventory = useCallback(async () => {
    if (!activeSlug) {
      setError('Tenant context is required to load Claim Documents.');
      return;
    }

    const inventoryRes = await api.getDocumentInventory({
      q: q.trim() || undefined,
      sortBy,
      sortDir,
      page,
      pageSize
    }, activeSlug);

    if (inventoryRes.ok && inventoryRes.data) {
      setDocuments(inventoryRes.data.documents);
      setMetrics(inventoryRes.data.metrics);
      setPagination(inventoryRes.data.pagination);
      setRecentEvents(inventoryRes.data.recentEvents);
      setError(null);
    } else {
      setError(inventoryRes.error || 'Failed to load document inventory');
    }
  }, [activeSlug, page, pageSize, q, sortBy, sortDir]);

  // Unified upload protocol for Ingestion Nodes
  const handleFileUpload = async (files: File[]) => {
    if (!activeSlug) {
      toast({
        title: 'Tenant Required',
        description: 'Open Claim Documents from a tenant workspace before uploading.',
        variant: 'destructive'
      });
      return;
    }

    if (!files || files.length === 0) {
      toast({
        title: 'Empty upload',
        description: 'Please select at least one document to upload.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Uploading documents',
      description: `Processing ${files.length} document(s)...`
    });

    try {
      setLoading(true);
      const form = new FormData();
      for (const file of files) {
        form.append('file', file);
      }
      const { token, userId, tenantId } = await getFrontendAuthContext();

      const response = await fetch(api.buildApiUrl(`/api/documents/upload?tenantSlug=${activeSlug}`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(userId ? { 'x-user-id': userId } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        },
        body: form
      });

      const rawText = await response.text();
      let payload: any = null;
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch {
        payload = { message: rawText };
      }

      if (!response.ok) {
        const firstFailureReason =
          Array.isArray(payload?.failed_files) && payload.failed_files[0]?.reason
            ? String(payload.failed_files[0].reason)
            : '';
        const failureMessage = firstFailureReason || payload?.error || payload?.message || rawText || 'Document upload failed.';
        throw new Error(failureMessage);
      }

      const savedCount = Number(payload?.file_count ?? payload?.documents?.length ?? 0);
      const requestedCount = Number(payload?.requested_file_count ?? files.length);
      const failedFiles = Array.isArray(payload?.failed_files) ? payload.failed_files : [];
      const partialUpload = Boolean(payload?.partial) || failedFiles.length > 0 || savedCount < requestedCount;

      if (savedCount <= 0) {
        throw new Error('Upload completed without saving any documents.');
      }

      await refreshInventory();

      toast({
        title: partialUpload ? 'Upload partially completed' : 'Upload successful',
        description: partialUpload
          ? `${savedCount} of ${requestedCount} document(s) were saved.${failedFiles[0]?.reason ? ` ${failedFiles[0].reason}` : ''}`
          : `${savedCount} document(s) uploaded and queued for evidence parsing.`
      });
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!docLogContainerRef.current) return;
    docLogContainerRef.current.scrollTop = 0;
  }, [recentEvents]);

  const filteredDocLogs = useMemo(() => {
    if (!docLogSearch.trim()) return recentEvents;
    const term = docLogSearch.trim().toLowerCase();
    return recentEvents.filter(event =>
      event.narrative.toLowerCase().includes(term) ||
      event.eventType.toLowerCase().includes(term) ||
      event.filename.toLowerCase().includes(term)
    );
  }, [docLogSearch, recentEvents]);

  const latestInventoryTimestamp = useMemo(() => {
    return recentEvents[0]?.timestamp || documents[0]?.updated_at || documents[0]?.created_at || null;
  }, [documents, recentEvents]);

  useStatusStream((event) => {
    if (!activeSlug) return;

    if (event.eventType === 'evidence_ingestion_completed') {
      toast({ title: 'Scan complete', description: 'Evidence inventory refreshed from the latest backend ingestion decisions.' });
      void refreshInventory();
      return;
    }

    if (
      event.eventType === 'parsing_completed' ||
      event.eventType === 'matching_completed' ||
      event.eventType === 'evidence_matching_completed' ||
      event.eventType === 'evidence.linked'
    ) {
      const documentId = String(event.data?.document_id || event.entityId || '').trim();
      if (!documentId) {
        void refreshInventory();
        return;
      }

      if (!documents.some((doc) => doc.id === documentId)) {
        void refreshInventory();
        return;
      }

      setDocuments((currentDocuments) => {
        const nextDocuments = currentDocuments.map((doc) => {
          return applyLockerEvent(doc, event);
        });

        setMetrics((currentMetrics) => ({
          ...currentMetrics,
          matched: nextDocuments.filter((doc) => doc.linked_case_count > 0).length,
          parsed: nextDocuments.filter((doc) => ['completed', 'partial'].includes(getLockerParsingStatus(doc))).length,
          needsReview: nextDocuments.filter((doc) => doc.needs_review).length,
          failed: nextDocuments.filter((doc) => getLockerParsingStatus(doc) === 'failed').length
        }));

        return nextDocuments;
      });

      setRecentEvents((currentEvents) => appendAuditEvent(currentEvents, {
        id: `${event.eventType}:${documentId}:${event.timestamp}`,
        documentId,
        filename: String(event.data?.filename || documentId),
        eventType: event.eventType,
        timestamp: event.timestamp,
        narrative: String(event.data?.message || `${event.eventType} for ${documentId}`)
      }));
      return;
    }

    if (event.eventType === 'case.created') {
      void refreshInventory();
    }
  }, activeSlug);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isReady) return;
      if (!activeSlug) {
        setError('Tenant context is required to load Claim Documents.');
        return;
      }

      setLoading(true);
      const [inventoryRes, gmailRes] = await Promise.all([
        api.getDocumentInventory({
          q: q.trim() || undefined,
          sortBy,
          sortDir,
          page,
          pageSize
        }, activeSlug),
        api.getGmailStatus(activeSlug)
      ]);

      if (cancelled) return;

      if (inventoryRes.ok && inventoryRes.data) {
        setDocuments(inventoryRes.data.documents);
        setMetrics(inventoryRes.data.metrics);
        setPagination(inventoryRes.data.pagination);
        setRecentEvents(inventoryRes.data.recentEvents);
        setError(null);
      } else {
        setError(inventoryRes.error || 'Failed to load document inventory');
      }

      if (gmailRes.ok && gmailRes.data) {
        setGmailConnected(gmailRes.data.connected);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSlug, isReady, page, pageSize, q, refreshInventory, sortBy, sortDir]);
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
  const exportCsv = async () => {
    if (!activeSlug) return;

    const res = await api.getDocumentInventory({
      q: q.trim() || undefined,
      sortBy,
      sortDir,
      page: 1,
      pageSize: 5000
    }, activeSlug);

    if (!res.ok || !res.data) {
      toast({
        title: 'Export failed',
        description: res.error || 'Could not export the current inventory view.',
        variant: 'destructive'
      });
      return;
    }

    const rows = res.data.documents.map(d => ({
      id: d.id,
      filename: d.filename,
      source: d.source_display || '',
      content_type: d.content_type || '',
      size_bytes: d.size_bytes ?? '',
      uploaded_at: d.created_at,
      parser_status: d.parser_status || '',
      parsing_strategy: d.parsing_strategy || '',
      ingestion_strategy: d.ingestion_strategy || '',
      parser_confidence: d.parser_confidence != null ? `${(d.parser_confidence * 100).toFixed(0)}%` : 'Unknown',
      evidence_state: d.evidence_state,
      usable_as_evidence: d.usable_as_evidence ? 'Yes' : 'No',
      linked_case_count: d.linked_case_count,
      strongest_match_confidence: d.strongest_match_confidence != null ? `${(d.strongest_match_confidence * 100).toFixed(0)}%` : 'Unknown',
      supplier: d.supplier || '',
      invoice: d.invoice || '',
      amount: typeof d.amount === 'number' ? d.amount.toFixed(2) : ''
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
    if (!activeSlug) return;
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
    if (!activeSlug) return;
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) {
      return;
    }

    try {
      const res = await api.deleteDocument(docId, activeSlug);
      if (res.ok) {
        await refreshInventory();
        toast({ title: 'Document Deleted', description: `"${docName}" has been deleted.` });
      } else {
        throw new Error(res.error || 'Failed to delete document');
      }
    } catch (error: any) {
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Delete all documents
  const handleDeleteAllDocuments = async () => {
    if (!activeSlug) return;
    if (!confirm(`Are you sure you want to delete ALL ${metrics.totalDocuments} document(s) in this workspace? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.deleteAllDocuments(activeSlug);
      if (res.ok) {
        await refreshInventory();
        toast({ title: 'All Documents Deleted', description: `${res.data?.deletedCount || 0} document(s) have been deleted.` });
      } else {
        throw new Error(res.error || 'Failed to delete documents');
      }
    } catch (error: any) {
      toast({ title: 'Delete Failed', description: error.message, variant: 'destructive' });
    }
  };

  if (!activeSlug) {
    return (
      <div className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
        <div className="flex-1 flex h-full overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
            <div className="relative pt-8">
              <div className="relative w-full max-w-full mx-auto px-8 pb-10 text-white">
                <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl p-10">
                  <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Claim Documents</h1>
                  <p className="text-white/60 text-sm font-sans font-bold uppercase tracking-tight">Tenant context required</p>
                  <p className="text-white/35 mt-3 font-sans text-sm max-w-xl">
                    Claim Documents only renders inside a real tenant workspace. Open this page from a tenant-scoped route to load document inventory truthfully.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
              <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Claim Documents</h1>
                  <p className="text-sm text-white/50 font-sans max-w-3xl">
                    Review stored files, parsing progress, and case links that can support recoveries, filings, and payout follow-up.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white">
                    {latestInventoryTimestamp
                      ? `Updated ${formatDistanceToNow(new Date(latestInventoryTimestamp), { addSuffix: true })}`
                      : 'Update time unavailable'}
                  </div>
                  <Button
                    onClick={() => void refreshInventory()}
                    disabled={loading}
                    className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl p-6">
                  <GmailConnectionStatus onStatusChange={setGmailConnected} />
                </div>
                <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl p-6">
                    <EvidenceIngestion
                      gmailConnected={gmailConnected}
                      onIngestionComplete={() => {
                      void refreshInventory();
                    }}
                  />
                </div>
              </div>

              {/* Forensic Ingestion Terminal */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl mb-8 relative">
                {/* Terminal Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-3 w-3 text-white/40" />
                    <h2 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Document History</h2>
                  </div>
                  <span className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-tight">{filteredDocLogs.length} entries</span>
                </div>

                <div className="p-8">
                  {/* Terminal Search */}
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <span className="text-white/40 text-[10px] font-sans font-bold">$</span>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search document history..."
                      value={docLogSearch}
                      onChange={(e) => setDocLogSearch(e.target.value)}
                      className="pl-8 h-10 text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 focus:border-white/20 rounded-lg tracking-tight"
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
                        <Clock className="h-3 w-3 opacity-20" />
                        <span className="uppercase tracking-tight">No audit events for the current inventory view.</span>
                      </div>
                    ) : (
                      <div className="relative space-y-1.5">
                        {filteredDocLogs.map((log) => (
                          <div key={log.id} className="flex flex-col group/log">
                            <div className="flex items-start gap-4 hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded transition-colors">
                              <span className="text-white/10 shrink-0 select-none tabular-nums group-hover/log:text-white/20 transition-colors">
                                [{new Date(log.timestamp).toLocaleTimeString()}]
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-white/60 font-bold uppercase tracking-tight">{log.eventType}</span>
                              </div>
                              <span className={cn("flex-1 break-words leading-relaxed", getAuditEventColor(log.eventType))}>
                                <span className="mr-2 opacity-50">{">>"}</span>
                                {log.narrative}
                                <span className="ml-2 text-white/30 border-l border-white/10 pl-2">
                                  {log.filename}
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Ingestion Node - Dropzone */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl mb-12 relative p-10">
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/15 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/15 rounded-tr-xl" />

                <div
                  className={cn(
                    "border border-dashed transition-all duration-300 rounded-xl p-12 text-center group relative overflow-hidden",
                    dragActive ? "border-white/25 bg-white/[0.04]" : "border-white/10 hover:border-white/20 bg-white/[0.01]"
                  )}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                >
                  <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <Cloud className={cn("h-10 w-10 mx-auto mb-6 transition-all duration-300", dragActive ? "scale-110 text-white/80" : "text-white/10 group-hover:text-white/20")} />
                  <h3 className="text-sm font-sans font-bold text-white mb-2 uppercase tracking-tight">Document Ingestion</h3>
                  <p className="text-[10px] text-white/20 font-sans font-bold mb-8 uppercase tracking-tight">
                    Supported types: PDF, JPG, PNG
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      className="group relative px-6 py-2.5 bg-white hover:bg-white/90 transition-all rounded-lg overflow-hidden"
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
                      <Link to={`/app/${activeSlug}/integrations-hub`} className="text-[10px] font-sans font-bold text-white/50 hover:text-white uppercase tracking-tight transition-colors">
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
                      <span className="text-sm font-sans font-bold text-white tracking-tight uppercase">{metrics.filteredResults} results</span>
                      <div className="h-1.5 w-[1px] bg-white/10" />
                      <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Total archive: {metrics.totalDocuments}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group/search">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within/search:text-white transition-colors" />
                      <Input
                        placeholder="Search documents..."
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setPage(1);
                        }}
                        className="h-9 w-64 bg-white/[0.03] border-white/10 text-[11px] font-sans font-bold pl-9 focus:border-white/20 transition-all rounded-lg placeholder:text-white/10 tracking-tight"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-4 text-[10px] font-sans font-bold text-white/20 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all uppercase tracking-tight rounded-lg"
                      onClick={exportCsv}
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      EXPORT
                    </Button>

                    {metrics.totalDocuments > 0 && (
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
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/25 opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-white/35"></span>
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
                      {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-28">
                          <CircleDashed className="h-6 w-6 text-white/15 mb-4" />
                          <span className="text-[11px] font-sans font-bold text-white/30 uppercase tracking-tight">
                            {metrics.totalDocuments === 0 ? 'No documents in this workspace' : 'No documents match the current search'}
                          </span>
                        </div>
                      ) : (
                      <div className="divide-y divide-white/5 overflow-hidden">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="group relative flex items-center justify-between py-6 px-8 hover:bg-white/[0.02] transition-all duration-300"
                          >
                            <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-white/60 shadow-[0_0_15px_rgba(255,255,255,0.18)] opacity-0 group-hover:opacity-100 transition-opacity" />

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
                                  className="h-3.5 w-3.5 border-white/20 rounded-sm data-[state=checked]:bg-white data-[state=checked]:border-none transition-colors"
                                />
                                <Hexagon className="h-3.5 w-3.5 text-white/5 group-hover:text-white/40 transition-colors" />
                              </div>

                              <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-white tracking-tight truncate uppercase group-hover:text-white/80 transition-colors">
                                    {doc.name}
                                  </span>
                                  <Badge className={cn("text-[9px] font-sans font-bold uppercase tracking-tight flex items-center gap-1.5", getEvidenceStateBadgeClass(doc))}>
                                    {getEvidenceStateIcon(doc.evidence_state)}
                                    {getEvidenceStateLabel(doc)}
                                  </Badge>
                                  {doc.linked_case_count > 0 && (
                                    <div className="px-2 py-0.5 bg-white/10 border border-white/15 text-[9px] font-sans font-bold text-white/75 uppercase tracking-tight flex items-center gap-1.5">
                                      <Link2 className="h-2.5 w-2.5" />
                                      {doc.linked_case_count} linked cases
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center text-[10px] font-sans font-bold text-white/20 gap-4 uppercase tracking-tight">
                                  <span className="text-white/40">{doc.source_display || "Unknown source"}</span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">{doc.content_type || "Type unavailable"}</span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">{formatBytes(doc.size_bytes)}</span>
                                  <span className="text-white/5">|</span>
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const parsingStatus = getLockerParsingStatus(doc);
                                      return (
                                        <>
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                      parsingStatus === 'completed' ? 'bg-white/70 shadow-white/20' :
                                        parsingStatus === 'partial' ? 'bg-amber-400 shadow-amber-400/50' :
                                          parsingStatus === 'processing' ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' :
                                            parsingStatus === 'failed' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-white/10'
                                    )} />
                                    <span className={cn(
                                      parsingStatus === 'completed' ? 'text-white/60' :
                                        parsingStatus === 'partial' ? 'text-amber-400/80' :
                                          parsingStatus === 'failed' ? 'text-rose-500/60' : 'text-white/20'
                                    )}>
                                      {formatAutonomyLabel(doc.parsing_strategy || parsingStatus)}
                                    </span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">
                                    {doc.parser_confidence != null ? `${(doc.parser_confidence * 100).toFixed(0)}% confidence` : "Confidence unknown"}
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

                                <div className="flex items-center text-[10px] font-sans font-bold text-white/20 gap-4 tracking-tight">
                                  <span className="text-white/40">Supplier: {doc.supplier || "Not available"}</span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">Invoice: {doc.invoice || "Not available"}</span>
                                  <span className="text-white/5">|</span>
                                  <span className="text-white/40">{doc.usability_reason}</span>
                                  {getLockerIngestionLabel(doc) ? (
                                    <>
                                      <span className="text-white/5">|</span>
                                      <span className="text-white/40">Intake: {getLockerIngestionLabel(doc)}</span>
                                    </>
                                  ) : null}
                                  {getLockerParsingReason(doc) ? (
                                    <>
                                      <span className="text-white/5">|</span>
                                      <span className="text-white/40 truncate max-w-[28rem]">Decision: {getLockerParsingReason(doc)}</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {doc.linked_case_count > 0 && (
                                <Link
                                  to={`/app/${activeSlug}/recoveries/${encodeURIComponent(doc.linked_case_ids[0])}`}
                                  className="text-[10px] font-sans font-bold text-white/20 hover:text-white transition-colors uppercase tracking-tight flex items-center gap-2"
                                >
                                  {doc.linked_case_refs[0] || `ID_${doc.linked_case_ids[0].slice(0, 8)}`}
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
                      )}

                      {/* Ledger Pagination */}
                      <div className="px-8 py-6 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                              <Checkbox
                              checked={selectedIds.size > 0 && selectedIds.size === documents.length}
                              onCheckedChange={(c) => {
                                if (c) setSelectedIds(new Set(documents.map(d => d.id)));
                                else setSelectedIds(new Set());
                              }}
                              className="h-3 w-3 border-white/10 rounded-sm"
                            />
                            <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Selection</span>
                          </div>
                          <span className="text-white/5 h-3 w-[1px]" />
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">
                            PAGE {pagination.page} OF {pagination.totalPages}
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
                              disabled={pagination.page <= 1}
                              onClick={() => setPage(p => Math.max(1, (pagination.page || p) - 1))}
                            >
                              PREVIOUS
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-9 px-4 text-[10px] font-sans font-bold text-white/20 hover:text-white border border-white/5 rounded-lg disabled:opacity-10 tracking-tight"
                              disabled={pagination.page >= pagination.totalPages}
                              onClick={() => setPage(p => Math.min(pagination.totalPages, (pagination.page || p) + 1))}
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
