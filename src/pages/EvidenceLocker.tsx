import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { tenantRoute } from '@/lib/routes';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Cloud,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  FileWarning,
  History,
  Info,
  Layers,
  Link2,
  RefreshCw,
  Search,
  ShieldAlert,
  Upload,
} from 'lucide-react';

interface LockerDocumentRow {
  id: string;
  name: string;
  filename: string;
  original_filename?: string | null;
  created_at: string;
  updated_at?: string;
  parser_status?: string;
  parser_confidence?: number | null;
  parser_error?: string | null;
  parsing_strategy?: string | null;
  parsing_explanation?: { reason?: string } | null;
  ingestion_strategy?: string | null;
  source?: string | null;
  provider?: string | null;
  source_display?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  supplier?: string | null;
  invoice?: string | null;
  amount?: number | null;
  extracted?: Record<string, any> | null;
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
  lifecycle_state?: 'active' | 'archived' | 'superseded' | string;
  archived_at?: string | null;
  archived_reason?: string | null;
  superseded_by_document_id?: string | null;
  supersedes_document_id?: string | null;
}

type LinkedRecovery = {
  claimId: string;
  claimNumber?: string;
  claimType: string;
  linkDate: string;
  matchType: string;
  confidence: number;
};

type AuditEvent = {
  id: string;
  eventType: string;
  timestamp: string;
  actor?: string;
  narrative: string;
};

const formatBytes = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return 'Not available';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const artifactKind = (doc: LockerDocumentRow) => {
  const name = doc.original_filename || doc.filename || doc.name || '';
  if (doc.content_type === 'application/pdf' || /\.pdf$/i.test(name)) return 'PDF document';
  if (doc.content_type === 'text/csv' || /\.csv$/i.test(name)) return 'CSV record';
  if (/\.xlsx?$|\.ods$/i.test(name) || /spreadsheet|excel/i.test(doc.content_type || '')) return 'Spreadsheet';
  return 'Source document';
};

const parsingStatus = (doc: LockerDocumentRow) => String(doc.parser_status || '').toLowerCase();

const lifecycleLabel = (doc: LockerDocumentRow) => {
  const lifecycle = String(doc.lifecycle_state || 'active').toLowerCase();
  if (lifecycle === 'archived') {
    return {
      label: 'Archived',
      detail: doc.usability_reason || 'Preserved for historical inspection; not used for new evidence work.',
      tone: 'neutral' as const,
    };
  }
  if (lifecycle === 'superseded') {
    return {
      label: 'Superseded',
      detail: doc.usability_reason || 'A replacement is recorded; this original remains historically inspectable.',
      tone: 'neutral' as const,
    };
  }

  const parser = parsingStatus(doc);
  if (parser === 'failed') {
    return { label: 'Processing needs attention', detail: doc.parser_error || 'Margin could not complete structured extraction from this artifact.', tone: 'danger' as const };
  }
  if (parser === 'pending' || parser === 'processing' || !parser) {
    return { label: 'Processing', detail: 'The artifact is stored. Margin is processing available fields before a relationship can be evaluated.', tone: 'info' as const };
  }
  if (parser === 'partial') {
    return { label: 'Parsed with gaps', detail: 'Some fields were extracted, but a reviewer may need a clearer or more complete source artifact.', tone: 'warning' as const };
  }
  if (doc.linked_case_count > 0) {
    return { label: 'Recorded relationship', detail: 'This artifact has a recorded relationship to one or more recoveries. That relationship is not proof or a closure conclusion.', tone: 'linked' as const };
  }
  return { label: 'Parsed — awaiting relationship', detail: 'The artifact is stored and parsed, but no recovery relationship is recorded yet.', tone: 'info' as const };
};

const relationshipSummary = (doc: LockerDocumentRow) => {
  const count = doc.linked_case_count || doc.linked_case_refs.length;
  if (count === 0) {
    return { title: 'No recovery relationship recorded', detail: 'Margin has not recorded a case relationship for this artifact.', tone: 'neutral' as const };
  }
  const reference = doc.linked_case_refs[0] || 'Recovery reference unavailable';
  return {
    title: count === 1 ? `Linked to ${reference}` : `Linked to ${count} recoveries`,
    detail: doc.linkage_strength === 'strong'
      ? 'Recorded as a strong matching relationship; case-level evaluation remains authoritative.'
      : 'Recorded for review; relationship confidence does not establish proof or a recovery outcome.',
    tone: 'linked' as const,
  };
};

const badgeClass = (tone: 'neutral' | 'info' | 'warning' | 'danger' | 'linked') => {
  const classes = {
    neutral: 'border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]',
    info: 'border-[#BFD8F6] bg-[#F3F7FF] text-[#0B74DE]',
    warning: 'border-[#F2D69C] bg-[#FFFBEA] text-[#8A5A00]',
    danger: 'border-[#F1C9C5] bg-[#FFF8F7] text-[#B42318]',
    linked: 'border-[#BFE0CF] bg-[#F4FAF7] text-[#2F6C54]',
  };
  return classes[tone];
};

export default function EvidenceLocker() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const activeSlug = tenantSlug;
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<LockerDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<LockerDocumentRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkedRecoveries, setLinkedRecoveries] = useState<LinkedRecovery[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [replacementFor, setReplacementFor] = useState<LockerDocumentRow | null>(null);

  const query = (searchParams.get('q') || '').trim();

  const refreshInventory = useCallback(async () => {
    if (!activeSlug) return;
    setLoading(true);
    try {
      const response = await api.getDocumentInventory({
        q: query || undefined,
        page: 1,
        pageSize: 100,
        sortBy: 'created_at',
        sortDir: 'desc',
      }, activeSlug);

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'Evidence inventory could not be loaded.');
      }

      setDocuments(response.data.documents as LockerDocumentRow[]);
      setError(null);
    } catch (requestError: any) {
      setError(requestError?.message || 'Evidence inventory could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [activeSlug, query]);

  useEffect(() => {
    void refreshInventory();
  }, [refreshInventory]);

  useEffect(() => {
    if (!detailOpen || !selectedDoc || !activeSlug) return;
    let cancelled = false;
    setDetailLoading(true);
    setLinkedRecoveries([]);
    setAuditEvents([]);

    void Promise.all([
      api.getDocumentLinkedClaims(selectedDoc.id, activeSlug),
      api.getDocumentAuditTrail(selectedDoc.id, activeSlug),
    ]).then(([linksResponse, auditResponse]) => {
      if (cancelled) return;
      if (linksResponse.ok && linksResponse.data) {
        setLinkedRecoveries(linksResponse.data.linkedClaims || []);
      }
      if (auditResponse.ok && auditResponse.data) {
        setAuditEvents(auditResponse.data.events || []);
      }
    }).catch(() => {
      if (!cancelled) {
        toast({
          title: 'Some document history is unavailable',
          description: 'The stored artifact and its recorded relationship remain available. Try refreshing this record later.',
          variant: 'destructive',
        });
      }
    }).finally(() => {
      if (!cancelled) setDetailLoading(false);
    });

    return () => { cancelled = true; };
  }, [activeSlug, detailOpen, selectedDoc, toast]);

  const visibleMetrics = useMemo(() => ({
    total: documents.length,
    linked: documents.filter((doc) => doc.linked_case_count > 0).length,
    actionNeeded: documents.filter((doc) => {
      const state = lifecycleLabel(doc).label;
      return state === 'Processing needs attention' || state === 'Parsed with gaps';
    }).length,
  }), [documents]);

  const latestTimestamp = useMemo(() => {
    const latest = documents[0]?.updated_at || documents[0]?.created_at;
    return latest || null;
  }, [documents]);

  const evidenceActionSummary = visibleMetrics.actionNeeded > 0
    ? {
      title: `${visibleMetrics.actionNeeded} stored artifact${visibleMetrics.actionNeeded === 1 ? '' : 's'} need processing attention`,
      detail: 'Margin has not recorded a seller evidence request. These artifacts have parsing gaps or failures, so their source record should be inspected before relying on them in case-level review.',
    }
    : {
      title: 'No seller evidence action is recorded',
      detail: 'When Margin has an authoritative case-specific evidence requirement, it will appear with the recovery, the requested artifact, and why it is needed. You can still store or reuse an artifact here.',
    };

  const openUploader = (documentToReplace?: LockerDocumentRow | null) => {
    setReplacementFor(documentToReplace || null);
    uploadInputRef.current?.click();
  };

  const handleFileUpload = async (files: File[]) => {
    if (!activeSlug || files.length === 0) return;
    setUploading(true);
    try {
      const response = await api.uploadDocuments(files, activeSlug);
      const payload = response.data;
      if (!response.ok || !payload) {
        const failure = payload?.failed_files?.[0]?.reason || payload?.error || response.error || 'The artifact could not be stored.';
        throw new Error(failure);
      }

      const savedCount = Number(payload.file_count || payload.documents?.length || 0);
      const requestedCount = Number(payload.requested_file_count || files.length);
      if (savedCount === 0) throw new Error(payload.failed_files?.[0]?.reason || 'No artifact was stored.');

      if (replacementFor && payload.documents?.[0]?.id) {
        const supersede = await api.supersedeDocument(replacementFor.id, payload.documents[0].id, activeSlug);
        if (!supersede.ok) {
          throw new Error(supersede.error || 'The replacement was stored, but its lineage could not be recorded.');
        }
        toast({
          title: 'Replacement recorded',
          description: 'The original artifact remains historically inspectable; the new artifact now records that lineage.',
        });
      } else {
        toast({
          title: savedCount < requestedCount || payload.partial ? 'Upload partially completed' : 'Artifact stored',
          description: savedCount < requestedCount || payload.partial
            ? `${savedCount} of ${requestedCount} artifact(s) were stored. ${payload.failed_files?.[0]?.reason || ''}`
            : `${savedCount} artifact(s) were stored and queued for processing. Parsed fields or relationships will appear only when they are recorded.`,
        });
      }

      setReplacementFor(null);
      setDetailOpen(false);
      await refreshInventory();
    } catch (requestError: any) {
      toast({
        title: replacementFor ? 'Replacement could not be completed' : 'Upload failed',
        description: requestError?.message || 'Check the source artifact and try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const archiveSelectedDocument = async () => {
    if (!activeSlug || !selectedDoc) return;
    const linkedCount = selectedDoc.linked_case_count || selectedDoc.linked_case_refs.length;
    const confirmation = linkedCount > 0
      ? `Archive “${selectedDoc.name}”? It is linked to ${linkedCount} recovery ${linkedCount === 1 ? 'record' : 'records'}. The original artifact and recorded relationships will remain historically inspectable, but it will not be used for new evidence work.`
      : `Archive “${selectedDoc.name}”? The source artifact and provenance will be preserved, but it will not be used for new evidence work.`;

    if (!window.confirm(confirmation)) return;

    try {
      const response = await api.archiveDocument(selectedDoc.id, 'Archived from Evidence Locker by seller', activeSlug);
      if (!response.ok) throw new Error(response.error || 'The artifact could not be archived.');
      toast({ title: 'Artifact archived safely', description: response.data?.message || 'The source artifact and its provenance remain preserved.' });
      setDetailOpen(false);
      await refreshInventory();
    } catch (requestError: any) {
      toast({ title: 'Archive failed', description: requestError?.message || 'The artifact remains unchanged.', variant: 'destructive' });
    }
  };

  if (!activeSlug) {
    return (
      <PageLayout title="Evidence Locker" noPadding>
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7] px-6 text-center">
          <div className="max-w-md rounded-[10px] border border-[#DCE8EE] bg-white p-8 shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <ShieldAlert className="mx-auto h-7 w-7 text-[#66737F]" />
            <h1 className="mt-4 font-lora text-[25px] text-[#182026]">Workspace required</h1>
            <p className="mt-2 text-[13px] leading-6 text-[#66737F]">Evidence Locker is available only inside an active Margin workspace.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Evidence Locker" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] text-[#182026]">
        <header className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-4 py-7 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Evidence control</p>
              <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[40px]">Evidence Locker</h1>
              <p className="mt-2.5 text-[14px] leading-6 text-[#66737F]">Store an artifact once, inspect where Margin has recorded it, and understand the boundary between a parsed document, a recovery relationship, and a case-level conclusion.</p>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#66737F]">
              <span>{latestTimestamp ? `Updated ${formatDistanceToNow(new Date(latestTimestamp), { addSuffix: true })}` : 'No evidence record loaded'}</span>
              <Button onClick={() => void refreshInventory()} disabled={loading || uploading} variant="outline" size="sm" className="h-9 border-[#DCE8EE] bg-white text-[#4D5B66] hover:bg-[#F7FAFC]">
                <RefreshCw className={cn('mr-2 h-3.5 w-3.5', loading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#DCE8EE] bg-[#F7FAFC] text-[#0B74DE]"><FilePlus2 className="h-4 w-4" /></div>
                <div>
                  <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Action required</p>
                  <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-[#182026]">{evidenceActionSummary.title}</h2>
                  <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[#66737F]">{evidenceActionSummary.detail}</p>
                </div>
              </div>
              <Button onClick={() => openUploader()} disabled={uploading} className="h-10 shrink-0 bg-[#0B74DE] px-4 text-[12px] font-medium hover:bg-[#075EA8]">
                <Upload className="mr-2 h-3.5 w-3.5" />
                {uploading ? 'Storing artifact…' : 'Provide artifact'}
              </Button>
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Artifacts in this view', value: visibleMetrics.total, detail: 'Calculated from the records displayed below.' },
              { label: 'Recorded recovery relationships', value: visibleMetrics.linked, detail: 'A relationship is not proof or a financial conclusion.' },
              { label: 'Processing attention', value: visibleMetrics.actionNeeded, detail: 'Artifacts with parsing gaps or failures.' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-[10px] border border-[#DCE8EE] bg-white p-4">
                <p className="text-[11px] font-medium tracking-tight text-[#66737F]">{metric.label}</p>
                <p className="mt-2 font-lora text-[28px] leading-none text-[#182026]">{metric.value}</p>
                <p className="mt-2 text-[11px] leading-5 text-[#66737F]">{metric.detail}</p>
              </div>
            ))}
          </section>

          <section className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Reusable evidence library</p>
                <h2 className="mt-1 font-lora text-[25px] font-normal tracking-tight text-[#182026]">Artifacts and recorded relationships</h2>
              </div>
              <Button asChild variant="outline" size="sm" className="h-9 border-[#DCE8EE] bg-white text-[#4D5B66] hover:bg-[#F7FAFC]">
                <Link to={tenantRoute(activeSlug, '/integrations-hub')}><Cloud className="mr-2 h-3.5 w-3.5" />Connect source</Link>
              </Button>
            </div>

            <div className="relative mt-4 flex items-center rounded-md border border-[#DCE8EE] bg-white focus-within:border-[#0B74DE] focus-within:ring-2 focus-within:ring-[#0B74DE]/15">
              <Search className="ml-3 h-4 w-4 text-[#66737F]" />
              <input
                value={query}
                onChange={(event) => setSearchParams(event.target.value ? { q: event.target.value } : {})}
                placeholder="Search artifact names, sources, suppliers, and recovery references"
                className="h-10 w-full bg-transparent px-3 text-[13px] tracking-tight outline-none placeholder:text-[#8A97A2]"
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-[8px] border border-[#F1C9C5] bg-[#FFF8F7] px-4 py-3 text-[12px] leading-5 text-[#B42318]">{error}</div>
            ) : null}

            <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
              <Table>
                <TableHeader className="bg-[#FAFAF7]">
                  <TableRow className="border-[#DCE8EE] hover:bg-transparent">
                    <TableHead className="h-10 min-w-[260px] px-5 text-[11px] font-medium tracking-tight text-[#66737F]">Artifact</TableHead>
                    <TableHead className="h-10 min-w-[190px] text-[11px] font-medium tracking-tight text-[#66737F]">Evidence status</TableHead>
                    <TableHead className="h-10 min-w-[245px] text-[11px] font-medium tracking-tight text-[#66737F]">Recorded impact</TableHead>
                    <TableHead className="h-10 min-w-[170px] text-[11px] font-medium tracking-tight text-[#66737F]">Provenance</TableHead>
                    <TableHead className="h-10 px-5 text-right text-[11px] font-medium tracking-tight text-[#66737F]">Inspect</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && documents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-[#66737F]" /><p className="text-[13px] text-[#66737F]">Loading evidence records</p></TableCell></TableRow>
                  ) : documents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center"><FileText className="mx-auto mb-3 h-5 w-5 text-[#66737F]" /><h3 className="text-[15px] font-semibold tracking-tight">No artifacts in this view</h3><p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#66737F]">Evidence Locker stores source artifacts and their recorded recovery relationships. Provide an artifact when you want Margin to retain it for processing or future evidence matching.</p><Button className="mt-4 h-9 bg-[#0B74DE] text-[12px] hover:bg-[#075EA8]" onClick={() => openUploader()}><Upload className="mr-2 h-3.5 w-3.5" />Provide artifact</Button></TableCell></TableRow>
                  ) : documents.map((doc) => {
                    const status = lifecycleLabel(doc);
                    const relationship = relationshipSummary(doc);
                    return (
                      <TableRow key={doc.id} className="cursor-pointer border-[#E7EEF2] transition-colors hover:bg-[#F8FBFD]" onClick={() => { setSelectedDoc(doc); setDetailOpen(true); }}>
                        <TableCell className="px-5 py-4 align-top">
                          <div className="flex min-w-[260px] items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-[#E7EEF2] bg-white text-[#66737F]"><FileText className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-[13px] font-semibold tracking-tight text-[#182026]">{doc.name}</p><p className="mt-1 text-[11px] text-[#66737F]">{artifactKind(doc)} · {formatBytes(doc.size_bytes)}</p></div></div>
                        </TableCell>
                        <TableCell className="py-4 align-top"><div className="min-w-[190px]"><Badge variant="outline" className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', badgeClass(status.tone))}>{status.label}</Badge><p className="mt-2 text-[11px] leading-5 text-[#66737F]">{status.detail}</p></div></TableCell>
                        <TableCell className="py-4 align-top"><div className="min-w-[245px]"><div className="flex items-center gap-1.5 text-[#0B74DE]"><Link2 className="h-3.5 w-3.5" /><span className="text-[12px] font-medium tracking-tight">{relationship.title}</span></div><p className="mt-2 text-[11px] leading-5 text-[#66737F]">{relationship.detail}</p></div></TableCell>
                        <TableCell className="py-4 align-top"><div className="min-w-[170px] space-y-1"><p className="text-[11px] font-medium text-[#4D5B66]">{doc.source_display || doc.provider || doc.source || 'Source unavailable'}</p><p className="text-[10px] leading-4 text-[#8A99A5]">Added {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</p><p className="text-[10px] leading-4 text-[#8A99A5]">{doc.ingestion_strategy ? `Ingestion: ${doc.ingestion_strategy.toLowerCase()}` : 'Ingestion method unavailable'}</p></div></TableCell>
                        <TableCell className="px-5 py-4 text-right align-top"><ChevronRight className="ml-auto h-4 w-4 text-[#8A99A5]" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>

          <p className="mt-5 border-t border-[#DCE8EE] pt-5 text-[11px] leading-5 text-[#66737F]">A parsed artifact, a recorded recovery relationship, and case-level proof are different states. Evidence Locker preserves the artifact and its provenance; the relevant recovery record remains authoritative for current recovery, financial, payment, reversal, and closure truth.</p>
        </main>
      </div>

      <input ref={uploadInputRef} type="file" multiple={!replacementFor} className="hidden" onChange={(event) => { void handleFileUpload(Array.from(event.target.files || [])); event.currentTarget.value = ''; }} />

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-[#DCE8EE] bg-white p-0 text-[#182026] sm:max-w-[620px]">
          {selectedDoc ? (() => {
            const status = lifecycleLabel(selectedDoc);
            const linkedCount = selectedDoc.linked_case_count || selectedDoc.linked_case_refs.length;
            const canChangeLifecycle = String(selectedDoc.lifecycle_state || 'active') === 'active';
            return (
              <div className="flex min-h-full flex-col">
                <SheetHeader className="border-b border-[#DCE8EE] px-5 py-5 text-left sm:px-6">
                  <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Artifact record</p>
                  <SheetTitle className="mt-1 break-words font-lora text-[25px] font-normal leading-tight tracking-tight text-[#182026]">{selectedDoc.name}</SheetTitle>
                  <div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline" className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', badgeClass(status.tone))}>{status.label}</Badge><Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[10px] text-[#4D5B66]">{selectedDoc.source_display || selectedDoc.provider || selectedDoc.source || 'Source unavailable'}</Badge><Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[10px] text-[#4D5B66]">{artifactKind(selectedDoc)}</Badge></div>
                </SheetHeader>

                <div className="flex-1 space-y-6 px-5 py-5 sm:px-6">
                  <section className="rounded-[9px] border border-[#DCE8EE] bg-[#F7FAFC] p-4"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">What Margin has recorded</p><p className="mt-2 text-[13px] leading-6 text-[#182026]">{status.detail}</p><p className="mt-3 text-[11px] leading-5 text-[#66737F]">This is a Margin-generated status from stored parsing and relationship records. It is not source-authored evidence and does not independently establish a recovery outcome.</p></section>

                  <section><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-medium tracking-tight text-[#66737F]">Recovery relationships and reuse</p><h3 className="mt-1 text-[16px] font-semibold tracking-tight text-[#182026]">Where this artifact is recorded</h3></div><Layers className="h-4 w-4 text-[#66737F]" /></div>{detailLoading ? <p className="mt-4 text-[12px] text-[#66737F]">Loading recorded relationships…</p> : linkedRecoveries.length > 0 ? <div className="mt-4 divide-y divide-[#E7EEF2] overflow-hidden rounded-[8px] border border-[#DCE8EE]">{linkedRecoveries.map((recovery) => <div key={recovery.claimId} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#182026]">{recovery.claimNumber || 'Recovery reference unavailable'}</p><p className="mt-1 text-[10px] leading-4 text-[#66737F]">Recorded relationship: {String(recovery.matchType || 'linked').replace(/_/g, ' ')}{recovery.confidence != null ? ` · ${(recovery.confidence * 100).toFixed(0)}% matching confidence` : ''}</p></div><Button asChild variant="outline" size="sm" className="h-8 shrink-0 border-[#DCE8EE] bg-white px-2 text-[10px] text-[#4D5B66]"><Link to={tenantRoute(activeSlug, `/recoveries/${recovery.claimId}`)}>Open recovery<ArrowRight className="ml-1 h-3 w-3" /></Link></Button></div>)}</div> : <div className="mt-4 rounded-[8px] border border-[#DCE8EE] bg-white p-4"><p className="text-[12px] font-medium text-[#182026]">No recovery relationship recorded</p><p className="mt-1 text-[11px] leading-5 text-[#66737F]">Margin retains the artifact, but no linked recovery is available from the current evidence contract.</p></div>}</section>

                  <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-[8px] border border-[#DCE8EE] p-4"><p className="text-[11px] font-medium text-[#66737F]">What this can support</p><p className="mt-2 text-[12px] leading-5 text-[#4D5B66]">A parsed artifact or recorded relationship can provide source context for case-level evidence review. {linkedCount > 0 ? 'The linked recovery record decides how, if at all, it is evaluated.' : 'No recovery relationship has been recorded yet.'}</p></div><div className="rounded-[8px] border border-[#DCE8EE] p-4"><p className="text-[11px] font-medium text-[#66737F]">What this does not establish</p><p className="mt-2 text-[12px] leading-5 text-[#4D5B66]">It does not establish proof, filing authorization, reimbursement eligibility, payment, financial closure, or a recovery outcome by itself.</p></div></section>

                  <section><div className="flex items-center justify-between"><div><p className="text-[12px] font-medium tracking-tight text-[#66737F]">Provenance and processing</p><h3 className="mt-1 text-[16px] font-semibold tracking-tight text-[#182026]">Source record</h3></div><History className="h-4 w-4 text-[#66737F]" /></div><dl className="mt-4 divide-y divide-[#E7EEF2] overflow-hidden rounded-[8px] border border-[#DCE8EE]">{[{ label: 'Source', value: selectedDoc.source_display || selectedDoc.provider || selectedDoc.source || 'Not available' }, { label: 'Added', value: new Date(selectedDoc.created_at).toLocaleString() }, { label: 'Processing', value: selectedDoc.parser_status || 'Not available' }, { label: 'Parsing context', value: selectedDoc.parsing_explanation?.reason || 'No parser explanation recorded' }, { label: 'Lifecycle', value: selectedDoc.lifecycle_state || 'active' }].map((item) => <div key={item.label} className="grid gap-2 px-4 py-3 sm:grid-cols-[132px_minmax(0,1fr)]"><dt className="text-[10px] font-medium text-[#8A99A5]">{item.label}</dt><dd className="break-words text-[11px] leading-5 text-[#4D5B66]">{item.value}</dd></div>)}</dl></section>

                  <section><div className="flex items-center justify-between"><div><p className="text-[12px] font-medium tracking-tight text-[#66737F]">History</p><h3 className="mt-1 text-[16px] font-semibold tracking-tight text-[#182026]">Reconstructed from recorded events</h3></div><Info className="h-4 w-4 text-[#66737F]" /></div>{detailLoading ? <p className="mt-4 text-[12px] text-[#66737F]">Loading recorded history…</p> : auditEvents.length > 0 ? <div className="mt-4 space-y-3 border-l border-[#DCE8EE] pl-4">{auditEvents.map((event) => <div key={event.id} className="relative"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full border-2 border-white bg-[#0B74DE]" /><p className="text-[11px] font-semibold text-[#182026]">{String(event.eventType || 'recorded event').replace(/_/g, ' ')}</p><p className="mt-1 text-[11px] leading-5 text-[#66737F]">{event.narrative}</p><p className="mt-1 text-[10px] text-[#8A99A5]">{event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Time unavailable'}</p></div>)}</div> : <p className="mt-4 rounded-[8px] border border-[#DCE8EE] p-4 text-[11px] leading-5 text-[#66737F]">No recorded history is available yet. This does not change the stored artifact or its visible relationships.</p>}</section>
                </div>

                <div className="border-t border-[#DCE8EE] bg-white px-5 py-4 sm:px-6"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void api.getDocumentDownload(selectedDoc.id, activeSlug).then((response) => { if (response.ok && response.data?.url) window.open(response.data.url, '_blank'); else toast({ title: 'Download unavailable', description: response.error || 'A secure download link could not be created.', variant: 'destructive' }); })} className="h-9 border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]"><Download className="mr-2 h-3.5 w-3.5" />Download</Button><Button asChild variant="outline" className="h-9 border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]"><Link to={tenantRoute(activeSlug, `/documents/${selectedDoc.id}`)}>Full inspection<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>{canChangeLifecycle ? <><Button variant="outline" onClick={() => openUploader(selectedDoc)} disabled={uploading} className="h-9 border-[#BFD8F6] bg-[#F3F7FF] text-[11px] text-[#0B74DE]"><FilePlus2 className="mr-2 h-3.5 w-3.5" />Record replacement</Button><Button variant="outline" onClick={() => void archiveSelectedDocument()} className="h-9 border-[#F2D69C] bg-[#FFFBEA] text-[11px] text-[#8A5A00]"><Archive className="mr-2 h-3.5 w-3.5" />Archive safely</Button></> : null}</div></div>
              </div>
            );
          })() : null}
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
