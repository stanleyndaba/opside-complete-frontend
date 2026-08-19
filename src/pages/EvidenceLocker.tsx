import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, Clock, Eye, Download, Trash2, MoreHorizontal, RefreshCw, 
  Hexagon, AlertCircle, ArrowRight, Terminal, Database, Link2, 
  FileWarning, CheckCircle2, CircleDashed, Cloud, Upload, Mail,
  Shield, FileText, Zap, ArrowUpRight, Info, Filter, History,
  Lock, CheckCircle, ExternalLink, Paperclip, ChevronRight,
  BarChart3, FileSearch, Layers, Activity, DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getFrontendAuthContext } from '@/lib/authSession';
import { useStatusStream } from '@/hooks/use-status-stream';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAutonomyLabel, getIngestionTruth, getParsingTruth, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
import { tenantRoute } from '@/lib/routes';

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

const DEMO_DOCUMENT_TITLES = [
  'Amazon Inbound Shipment Summary – March 2026.xlsx',
  'Supplier Invoice – Shenzhen Optics Co. – INV-2841.pdf',
  'Warehouse Dispatch Confirmation – Batch 22.pdf',
  'Refund Without Return Audit – April 2026.csv',
  'Bill of Lading – FBA Shipment FBA15KD82.pdf',
  'Amazon Case Log Export – Reimbursement Claims.csv',
  'Inventory Reconciliation Statement – US Marketplace.xlsx',
  'Carrier Delivery Exception Notice – DHL Freight.pdf',
  'Proof of Delivery – UPS Freight – Tracking 1Z84X.pdf',
  'Settlement Transaction Report – Q2 2026.xlsx',
  'Supplier Packing List – SKU Group A.pdf',
  'Commercial Invoice – Inventory Batch 14.pdf',
  'FBA Inventory Adjustment Detail – May 2026.csv',
  'Receiving Discrepancy Report – FBA Shipment 4821.csv',
  'Shipment Manifest – Carton IDs + SKU Counts.pdf',
  'Amazon Reimbursement Notification – Case 16894380251.pdf',
  'Financial Ledger – Reimbursement Verification.xlsx',
  'Removal Order Damage Photos – Batch 19.pdf',
  'Lost Inventory Reconciliation Export – FNSKU Review.xlsx',
  'Carrier Weight Audit – Pallet Transfer 07.csv',
];

const buildDemoDocumentRows = (): LockerDocumentRow[] => {
  const baseDate = new Date('2026-05-10T14:00:00.000Z').getTime();

  return DEMO_DOCUMENT_TITLES.map((title, index) => {
    const ext = title.split('.').pop()?.toLowerCase();
    const contentType =
      ext === 'pdf' ? 'application/pdf' :
        ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
          ext === 'csv' ? 'text/csv' :
            'application/octet-stream';
    const createdAt = new Date(baseDate - index * 3_600_000).toISOString();
    const linked = index % 4 !== 3;

    return {
      id: `demo-evidence-document-${index + 1}`,
      name: title,
      filename: title,
      original_filename: title,
      created_at: createdAt,
      updated_at: createdAt,
      uploadDate: createdAt,
      status: 'processed',
      processing_status: 'completed',
      parser_status: 'completed',
      parser_confidence: 0.88 + ((index % 5) * 0.02),
      parser_error: null,
      parsing_strategy: 'FULL',
      parsing_explanation: {
        reason: 'Demo evidence parsed with complete identifiers, dates, and amount signals.',
        completed_steps: ['metadata', 'amounts', 'identifiers'],
        failed_steps: [],
        preserved_outputs: ['filename', 'supplier', 'invoice', 'amount'],
      },
      ingestion_strategy: 'FULL',
      ingestion_explanation: {
        reason: 'Demo source record is complete enough for evidence matching.',
        preserved_fields: ['filename', 'content_type', 'source', 'amount'],
        missing_fields: [],
      },
      extraction_signal_count: 6 + (index % 5),
      source: index % 3 === 0 ? 'amazon' : index % 3 === 1 ? 'gmail' : 'upload',
      provider: index % 3 === 0 ? 'amazon' : index % 3 === 1 ? 'gmail' : 'manual_upload',
      source_display: index % 3 === 0 ? 'Amazon Seller Central' : index % 3 === 1 ? 'Gmail Evidence Sync' : 'Manual Upload',
      content_type: contentType,
      size_bytes: 180_000 + index * 41_250,
      supplier: index % 5 === 0 ? 'Shenzhen Optics Co.' : index % 5 === 1 ? 'UPS Freight' : index % 5 === 2 ? 'Amazon FBA' : index % 5 === 3 ? 'DHL Freight' : 'Warehouse Ops',
      invoice: `DEMO-${2841 + index}`,
      amount: 84.35 + index * 37.9,
      parsedVia: 'demo-fixture',
      parsed_metadata: {},
      extracted: {},
      linked_case_count: linked ? 1 : 0,
      linked_case_ids: linked ? [`demo-case-${16874 + index}`] : [],
      linked_case_refs: linked ? [`RFD-${16874 + index}`] : [],
      strongest_match_confidence: linked ? 0.84 + ((index % 4) * 0.03) : null,
      strongest_match_type: linked ? 'demo_evidence_match' : null,
      linkage_strength: linked ? 'strong' : 'none',
      evidence_state: linked ? 'Linked Strongly' : 'Usable',
      usable_as_evidence: true,
      usability_reason: linked ? 'Ready for reimbursement support' : 'Parsed and ready for matching',
      needs_review: false,
    };
  });
};

const DEMO_DOCUMENT_ROWS = buildDemoDocumentRows();

type LiveLockerEvent = {
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  entityId?: string;
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

const getLockerParsingStatus = (doc: LockerDocumentRow) => getParsingTruth(doc).status;

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
  const { isReady, tenant } = useTenant();
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

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [docLogSearch, setDocLogSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<LockerDocumentRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 12;
  const q = searchParams.get('q') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortDir = searchParams.get('sortDir') || 'desc';

  const { toast } = useToast();
  const docLogContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const refreshInventory = useCallback(async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      const res = await api.getDocumentInventory({
        q: q.trim() || undefined,
        sortBy,
        sortDir,
        page,
        pageSize
      }, activeSlug);

      if (res.ok && res.data) {
        setDocuments(res.data.documents);
        setMetrics(res.data.metrics);
        setPagination(res.data.pagination);
        setRecentEvents(res.data.recentEvents);
        setError(null);
      } else {
        setError(res.error || 'Failed to load inventory');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeSlug, page, pageSize, q, sortBy, sortDir]);

  const handleFileUpload = async (files: File[]) => {
    if (!activeSlug || files.length === 0) return;
    setLoading(true);
    try {
      const { ok, data: payload, error: apiError, rawText } = await api.uploadDocuments(files, activeSlug);

      if (!ok) {
        const firstFailureReason = Array.isArray(payload?.failed_files) && payload.failed_files[0]?.reason;
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

  const latestInventoryTimestamp = useMemo(() => {
    return recentEvents[0]?.timestamp || documents[0]?.updated_at || documents[0]?.created_at || null;
  }, [documents, recentEvents]);

  const demoDocuments = useMemo(() => {
    if (activeSlug !== 'demo-workspace') return [];
    const term = q.trim().toLowerCase();
    if (!term) return DEMO_DOCUMENT_ROWS;

    return DEMO_DOCUMENT_ROWS.filter((doc) => {
      return [
        doc.name,
        doc.filename,
        doc.source_display,
        doc.content_type,
        doc.supplier,
        doc.invoice,
        ...doc.linked_case_refs,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [activeSlug, q]);

  const displayDocuments = useMemo(
    () => (demoDocuments.length > 0 ? [...demoDocuments, ...documents] : documents),
    [demoDocuments, documents]
  );

  const displayMetrics = useMemo(() => ({
    ...metrics,
    totalDocuments: metrics.totalDocuments + (activeSlug === 'demo-workspace' ? DEMO_DOCUMENT_ROWS.length : 0),
    filteredResults: metrics.filteredResults + demoDocuments.length,
  }), [activeSlug, demoDocuments.length, metrics]);

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

  const handleRowClick = (doc: LockerDocumentRow) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  if (!activeSlug) {
    return (
      <PageLayout title="Evidence Locker" noPadding>
        <div className="flex h-screen items-center justify-center bg-[#FAFAF7]">
          <div className="max-w-md border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
            <Shield className="mx-auto mb-4 h-10 w-10 text-[#9CA3AF]" />
            <h1 className="font-lora text-2xl font-normal tracking-tight text-[#111827]">Workspace Required</h1>
            <p className="mt-3 text-sm text-[#6B7280]">
              The Evidence Locker only renders inside an active workspace. Please select a marketplace to continue.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Evidence Locker" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Forensic Identity Header */}
        <div className="border-b border-[#E5E7EB] bg-white px-8 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-[#0B74DE]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B74DE]">Forensic Vault</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-bold uppercase tracking-tight text-[#6B7280]">
                  {latestInventoryTimestamp
                    ? `Last Sync ${formatDistanceToNow(new Date(latestInventoryTimestamp), { addSuffix: true })}`
                    : 'Sync time unavailable'}
                </div>
                <Button
                  onClick={() => void refreshInventory()}
                  disabled={loading}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-3 text-[11px] font-semibold tracking-tight text-[#6B7280] hover:bg-[#F3F5F4] hover:text-[#111827]"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
            <h1 className="mb-4 font-lora text-[32px] font-normal leading-tight tracking-tight text-[#111827]">
              Evidence Locker
            </h1>
            <p className="max-w-2xl text-[15px] font-normal leading-relaxed tracking-tight text-[#6B7280]">
              Forensic artifacts and reconciliation trails. Review parsed data points, Amazon case linkages, and verification trails required for recovery filing.
            </p>
          </div>
        </div>

        {/* Readiness Strip */}
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-8 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Artifacts:</span>
                <span className="text-[11px] font-bold text-[#111827]">{displayMetrics.totalDocuments} Total</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0B74DE]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Filing Ready:</span>
                <span className="text-[11px] font-bold text-[#111827]">{displayMetrics.matched} Linked</span>
              </div>
              <div className="flex items-center gap-2">
                <FileWarning className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Needs Review:</span>
                <span className="text-[11px] font-bold text-[#111827]">{displayMetrics.needsReview} Items</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportCsv}
                className="h-8 border-[#E5E7EB] bg-white px-3 text-[11px] font-bold uppercase tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]"
              >
                <Download className="mr-1.5 h-3 w-3" />
                Export CSV
              </Button>
              <div className="h-4 w-px bg-[#E5E7EB]" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(tenantRoute(activeSlug, '/integrations'))}
                className="h-8 border-[#E5E7EB] bg-white px-3 text-[11px] font-semibold tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]"
              >
                <Cloud className="mr-1.5 h-3 w-3" />
                Connect source
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => uploadInputRef.current?.click()}
                className="h-8 border-[#E5E7EB] bg-white px-3 text-[11px] font-semibold tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]"
              >
                <Upload className="mr-1.5 h-3 w-3" />
                Upload documents
              </Button>
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFileUpload(Array.from(e.target.files || []));
                  e.currentTarget.value = '';
                }}
              />
            </div>
          </div>
        </div>

        {/* Synthesis Bar */}
        <div className="mx-auto max-w-6xl px-8 pt-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center">
              <Search className="h-5 w-5 text-[#9CA3AF] group-focus-within:text-[#0B74DE] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Query the Evidence Locker... (e.g., 'Find shipment invoices for Case 16894')" 
              value={q}
              onChange={(e) => setSearchParams({ q: e.target.value, page: '1' })}
              className="h-14 w-full rounded-xl border border-[#E5E7EB] bg-white pl-12 pr-4 text-[15px] font-normal tracking-tight shadow-sm outline-none focus:border-[#0B74DE] focus:ring-0 transition-all"
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              <Badge variant="outline" className="bg-[#F3F5F4] text-[#6B7280] border-transparent font-medium text-[10px] px-2 py-0.5">
                ⌘ K
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="mx-auto max-w-6xl px-8 py-8">
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F9FAFB]">
                <TableRow className="border-b border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="w-[40%] text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] h-10 px-6">Artifact</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] h-10">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] h-10">Amazon Link</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] h-10">Confidence</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] h-10 px-6">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && displayDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-[#9CA3AF]" />
                      <p className="text-[11px] font-medium uppercase tracking-tight text-[#9CA3AF]">Synchronizing Vault...</p>
                    </TableCell>
                  </TableRow>
                ) : displayDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4]">
                        <Paperclip className="h-6 w-6 text-[#9CA3AF]" />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#111827]">No artifacts detected</h3>
                      <p className="mt-1 text-[12px] text-[#6B7280]">Connect a source or upload records to populate the vault.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayDocuments.map((doc) => (
                    <TableRow 
                      key={doc.id} 
                      className="group cursor-pointer border-b border-[#F3F5F4] hover:bg-[#F8FAFB] transition-colors"
                      onClick={() => handleRowClick(doc)}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white shadow-sm group-hover:border-[#0B74DE]/30 transition-colors">
                            <FileText className="h-4.5 w-4.5 text-[#4B5563]" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold tracking-tight text-[#111827]">{doc.name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{doc.source_display}</span>
                              <div className="h-1 w-1 rounded-full bg-[#E5E7EB]" />
                              <span className="text-[11px] font-medium text-[#6B7280]">{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-[#F3F5F4] text-[#4B5563] border-transparent font-medium text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                          {doc.content_type?.split('/').pop()?.toUpperCase() || 'RAW'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.linked_case_refs.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-[#0B74DE]">
                            <Link2 className="h-3 w-3" />
                            <span className="text-[12px] font-bold tracking-tight">{doc.linked_case_refs[0]}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-[#9CA3AF]">Unlinked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E5E7EB]">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                (doc.parser_confidence || 0) > 0.8 ? "bg-emerald-500" : "bg-amber-500"
                              )} 
                              style={{ width: `${(doc.parser_confidence || 0) * 100}%` }} 
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#111827]">
                            {doc.parser_confidence != null ? `${(doc.parser_confidence * 100).toFixed(0)}%` : '--'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Badge 
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-transparent",
                              doc.usable_as_evidence 
                                ? "bg-emerald-500/10 text-emerald-700" 
                                : "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {doc.usable_as_evidence ? 'Filing Ready' : 'Review Required'}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Registry Footer */}
        <div className="mx-auto max-w-6xl px-8 pb-20 pt-10">
          <div className="border-t border-[#E5E7EB] pt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">
              <Shield className="h-3 w-3" />
              Forensic Evidence Registry • US-EAST-1
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Sidebar */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full border-l border-[#E5E7EB] bg-white p-0 text-[#111827] sm:max-w-[550px]">
          {selectedDoc && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-[#E5E7EB] px-8 py-8 text-left">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-[#0B74DE]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B74DE]">Artifact Detail</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B7280]" onClick={() => downloadDoc(selectedDoc.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B7280]" onClick={() => handleDeleteDocument(selectedDoc.id, selectedDoc.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <SheetTitle className="font-lora text-2xl font-normal leading-tight tracking-tight text-[#111827]">
                  {selectedDoc.name}
                </SheetTitle>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-[#F3F5F4] text-[#4B5563] border-transparent font-medium text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                    {selectedDoc.source_display}
                  </Badge>
                  <Badge variant="outline" className="bg-[#F3F5F4] text-[#4B5563] border-transparent font-medium text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                    {formatBytes(selectedDoc.size_bytes)}
                  </Badge>
                  {selectedDoc.linked_case_refs.length > 0 && (
                    <Badge className="bg-[#0B74DE]/10 text-[#0B74DE] border-transparent font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                      Linked: {selectedDoc.linked_case_refs[0]}
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="space-y-10">
                  {/* Forensic Extraction Section */}
                  <div>
                    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#111827]">Forensic Extraction</h3>
                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
                      <div className="grid grid-cols-2 gap-y-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Invoice ID</p>
                          <p className="text-[13px] font-semibold text-[#111827]">{selectedDoc.invoice || '--'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Total Amount</p>
                          <p className="text-[13px] font-semibold text-[#111827]">
                            {selectedDoc.amount ? `$${selectedDoc.amount.toFixed(2)}` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Supplier</p>
                          <p className="text-[13px] font-semibold text-[#111827]">{selectedDoc.supplier || '--'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1">Parser Confidence</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#111827]">
                              {selectedDoc.parser_confidence != null ? `${(selectedDoc.parser_confidence * 100).toFixed(0)}%` : '--'}
                            </span>
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#E5E7EB]">
                              <div 
                                className="h-full bg-[#0B74DE] rounded-full" 
                                style={{ width: `${(selectedDoc.parser_confidence || 0) * 100}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 border-t border-[#E5E7EB] pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-3.5 w-3.5 text-[#0B74DE]" />
                          <span className="text-[11px] font-bold uppercase tracking-tight text-[#111827]">Operational Signal</span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-[#6B7280]">
                          {selectedDoc.parsing_explanation?.reason || "This document has been parsed and reconciled against Amazon's operational records. Key identifiers were extracted to build the evidence trail."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail Section */}
                  <div>
                    <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#111827]">Audit Trail</h3>
                    <div className="relative space-y-6 pl-4">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
                      
                      <div className="relative">
                        <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full border border-white bg-emerald-500 shadow-sm" />
                        <p className="text-[12px] font-semibold text-[#111827]">Ingestion Confirmed</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">Source: {selectedDoc.source_display} • {formatDistanceToNow(new Date(selectedDoc.created_at), { addSuffix: true })}</p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full border border-white bg-emerald-500 shadow-sm" />
                        <p className="text-[12px] font-semibold text-[#111827]">Forensic Parsing Complete</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">Strategy: {selectedDoc.parsing_strategy || 'FULL'} • Confidence: {(selectedDoc.parser_confidence || 0 * 100).toFixed(0)}%</p>
                      </div>

                      <div className="relative">
                        <div className={cn(
                          "absolute -left-[13px] top-1 h-2 w-2 rounded-full border border-white shadow-sm",
                          selectedDoc.linked_case_refs.length > 0 ? "bg-emerald-500" : "bg-[#9CA3AF]"
                        )} />
                        <p className="text-[12px] font-semibold text-[#111827]">Case Linkage</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          {selectedDoc.linked_case_refs.length > 0 
                            ? `Linked to Amazon Case ${selectedDoc.linked_case_refs[0]}` 
                            : 'Awaiting discrepancy match'}
                        </p>
                      </div>

                      <div className="relative">
                        <div className={cn(
                          "absolute -left-[13px] top-1 h-2 w-2 rounded-full border border-white shadow-sm",
                          selectedDoc.usable_as_evidence ? "bg-emerald-500" : "bg-[#9CA3AF]"
                        )} />
                        <p className="text-[12px] font-semibold text-[#111827]">Filing Readiness</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5">
                          {selectedDoc.usable_as_evidence ? 'Verified for Amazon Support' : 'Awaiting final forensic verification'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-6">
                <Button 
                  className="w-full h-11 bg-[#0B74DE] hover:bg-[#0861C5] text-white font-semibold tracking-tight text-[11px] rounded-lg shadow-lg shadow-[#0B74DE]/20"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Confirm Review
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
