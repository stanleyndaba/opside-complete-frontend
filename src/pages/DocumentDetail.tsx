import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Download,
  RefreshCw,
  Cloud,
  Calendar,
  Hash,
  AlertCircle,
  Clock,
  Link2,
  Copy,
  Activity,
  Shield,
  Database,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { formatAutonomyLabel, getIngestionTruth, getParsingTruth, summarizeOperationalExplanation } from '@/lib/autonomyTruth';

const chipTone = (tone: 'neutral' | 'success' | 'info' | 'danger' = 'neutral') => {
  const tones = {
    neutral: 'bg-[#F1F5F7] text-[#4D5B66]',
    success: 'bg-[#EEF8F2] text-[#2F6C54]',
    info: 'bg-[#EDF5FF] text-[#0B74DE]',
    danger: 'bg-[#FFF0EF] text-[#B42318]',
  };
  return tones[tone];
};

export default function DocumentDetail() {
  const { id, documentId, tenantSlug } = useParams();
  const { tenant, isReady } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug;
  if (!activeTenantSlug && isReady) {
    throw new Error('tenantSlug required for DocumentDetail');
  }

  const docId = (documentId as string) || (id as string) || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed((current) => !current);
  const mainClass = useMemo(() => (isSidebarCollapsed ? 'ml-16' : 'ml-[282px]'), [isSidebarCollapsed]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [matchedClaims, setMatchedClaims] = useState<any[]>([]);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [triggeringParse, setTriggeringParse] = useState(false);

  const fetchDocumentDetail = async (setLoadingState = true) => {
    if (!docId || !activeTenantSlug) return;
    if (setLoadingState) setLoading(true);

    try {
      const [docRes, linkedClaimsRes, auditRes] = await Promise.all([
        api.getDocumentWithParsedData(docId, activeTenantSlug),
        api.getDocumentLinkedClaims(docId, activeTenantSlug),
        api.getDocumentAuditTrail(docId, activeTenantSlug),
      ]);

      if (docRes.ok && docRes.data) {
        setDocumentData(docRes.data);
        setParsedData(docRes.data.parsed_metadata || null);
        setError(null);
      } else {
        setError(docRes.error || 'Failed to load document');
      }

      setMatchedClaims(linkedClaimsRes.ok && linkedClaimsRes.data?.linkedClaims ? linkedClaimsRes.data.linkedClaims : []);
      setDocumentHistory(
        auditRes.ok && auditRes.data?.events
          ? [...auditRes.data.events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          : [],
      );
    } catch (requestError: any) {
      setError(requestError?.message || 'Failed to load document');
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady || !docId || !activeTenantSlug) return;
    void fetchDocumentDetail(true);
  }, [docId, isReady, activeTenantSlug]);

  useEffect(() => {
    const status = getParsingTruth(documentData || {}).status;
    if (!docId || !activeTenantSlug || (status !== 'pending' && status !== 'processing')) return;

    const interval = setInterval(() => {
      void fetchDocumentDetail(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [docId, activeTenantSlug, documentData]);

  const handleTriggerParsing = async () => {
    if (!docId) return;
    setTriggeringParse(true);

    try {
      const response = await api.reparseDocument(docId, activeTenantSlug);
      if (response.ok) {
        await fetchDocumentDetail(false);
        toast({
          title: 'Artifact processing refreshed',
          description: 'Margin will refresh the recorded artifact details as processing progresses.',
        });
      } else {
        toast({ title: 'Unable to refresh artifact processing', description: 'Please try again.', variant: 'destructive' });
      }
    } catch (requestError: any) {
      toast({ title: 'Unable to refresh artifact processing', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setTriggeringParse(false);
    }
  };

  const extracted = documentData?.extracted || parsedData?.extracted || {};
  const parsingTruth = getParsingTruth(documentData || {});
  const ingestionTruth = getIngestionTruth(documentData || {});
  const parserConfidence = parsingTruth.confidence;
  const parserConfidenceLabel = parserConfidence != null ? `${(parserConfidence * 100).toFixed(0)}%` : 'Unknown';
  const extractedDataPointCount =
    (extracted.order_ids?.length || 0) +
    (extracted.asins?.length || 0) +
    (extracted.skus?.length || 0) +
    (extracted.amounts?.length || 0) +
    (extracted.tracking_numbers?.length || 0) +
    (extracted.invoice_numbers?.length || 0) +
    (extracted.dates?.length || 0);
  const parsingOperationalSummary = summarizeOperationalExplanation(parsingTruth.operationalExplanation);

  const evidenceDecision = (() => {
    const status = parsingTruth.status;
    if (status === 'pending' || status === 'processing') {
      return {
        usable: false,
        label: 'Not ready',
        reason: parsingOperationalSummary || 'Artifact processing is still in progress.',
        nextStep: parsingTruth.operationalExplanation?.next_action
          ? formatAutonomyLabel(parsingTruth.operationalExplanation.next_action)
          : 'Wait for artifact processing to complete before this document can inform case review.',
      };
    }
    if (status === 'failed') {
      return {
        usable: false,
        label: 'Needs review',
        reason: parsingOperationalSummary || 'Artifact processing could not record complete details.',
        nextStep: parsingTruth.operationalExplanation?.next_action
          ? formatAutonomyLabel(parsingTruth.operationalExplanation.next_action)
          : 'Refresh artifact processing or review the source document manually.',
      };
    }
    if (extractedDataPointCount === 0 && !(parsedData?.line_items?.length > 0)) {
      return { usable: false, label: 'Needs review', reason: 'No structured details were recorded.', nextStep: 'Review the source document manually or refresh artifact processing.' };
    }
    if (matchedClaims.length === 0) {
      return { usable: false, label: 'Unlinked', reason: 'Not linked to a recovery record yet.', nextStep: 'Wait for matching or link this document to the correct recovery record manually.' };
    }
    if (status === 'partial') {
      return {
        usable: false,
        label: 'Limited',
        reason: parsingTruth.explanation?.reason || 'Some usable details were preserved, but artifact processing is incomplete.',
        nextStep: 'Review the preserved fields before using this document in case review.',
      };
    }
    if (parserConfidence == null) {
      return { usable: false, label: 'Needs review', reason: 'Recorded detail confidence is unavailable.', nextStep: 'Review recorded fields manually before relying on this document in case review.' };
    }
    if (parserConfidence < 0.5) {
      return { usable: false, label: 'Needs review', reason: 'Recorded detail confidence is low.', nextStep: 'Manual review is required before this document supports case review.' };
    }
    return {
      usable: true,
      label: 'Ready for review',
      reason: 'Structured extraction is complete and the document is linked to a recovery record.',
      nextStep: 'The document can support case review. Filing-usable evidence is confirmed later through case links.',
    };
  })();

  const parserStatus = String(parsingTruth.status || 'unknown').toLowerCase();
  const parserChip = (() => {
    if (parserStatus === 'completed') return { label: 'Details recorded', tone: 'success' as const, icon: CheckCircle2 };
    if (parserStatus === 'partial') return { label: 'Some details recorded', tone: 'neutral' as const, icon: AlertCircle };
    if (parserStatus === 'pending' || parserStatus === 'processing') return { label: 'Processing artifact', tone: 'info' as const, icon: Clock };
    if (parserStatus === 'failed') return { label: 'Processing needs attention', tone: 'danger' as const, icon: AlertCircle };
    return { label: 'Processing state unavailable', tone: 'neutral' as const, icon: Activity };
  })();
  const ParserIcon = parserChip.icon;

  const documentName = String(documentData?.name || 'Unnamed document');
  const documentType = String(documentData?.content_type || documentData?.type || 'Not available');
  const sourceName = String(documentData?.source || documentData?.provider || 'Not available');
  const documentCreatedAt = documentData?.created_at ? format(new Date(documentData.created_at), 'yyyy-MM-dd HH:mm:ss') : 'Not available';
  const metadataItems = [
    { label: 'Document ID', value: docId, icon: Hash },
    { label: 'Document type', value: documentType, icon: Database },
    { label: 'Source', value: sourceName, icon: Cloud },
    { label: 'Added', value: documentCreatedAt, icon: Calendar },
  ];

  const handleDownload = async () => {
    if (!docId) return;
    try {
      const response = await api.getDocumentDownload(docId, activeTenantSlug);
      if (response.ok && response.data?.url) {
        window.open(response.data.url, '_blank');
      } else {
        toast({ title: 'Download unavailable', description: response.error || 'Could not get a document download URL.', variant: 'destructive' });
      }
    } catch (requestError: any) {
      toast({ title: 'Download unavailable', description: requestError?.message || 'Could not download this document.', variant: 'destructive' });
    }
  };

  const shell = (content: React.ReactNode) => (
    <div className="platform-vitality-page relative flex h-screen min-h-screen flex-col overflow-hidden bg-[#FAFAF7] text-[#182026]">
      <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
      <div className="flex h-full flex-1 overflow-hidden bg-[#FAFAF7]">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={cn('flex-1 overflow-y-auto bg-[#FAFAF7] font-sans transition-all duration-300', mainClass)}>{content}</main>
      </div>
    </div>
  );

  if (loading || error) {
    return shell(
      <div className="flex min-h-[500px] items-center justify-center px-6">
        {loading ? (
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE8EE] bg-white">
              <RefreshCw className="h-4 w-4 animate-spin text-[#0B74DE]" />
            </div>
            <p className="mt-4 text-[12px] text-[#66737F]">Opening document record…</p>
          </div>
        ) : (
          <div className="max-w-md rounded-[10px] border border-[#F3D1CC] bg-white px-6 py-7 text-center shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <AlertCircle className="mx-auto h-6 w-6 text-[#B42318]" />
            <h1 className="mt-4 font-lora text-[22px] font-normal tracking-tight text-[#182026]">Document unavailable</h1>
            <p className="mt-2 text-[12px] leading-5 text-[#66737F]">{error}</p>
            <Link to={tenantRoute(activeTenantSlug, '/evidence-locker')}>
              <Button variant="outline" className="mt-5 h-9 border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to documents
              </Button>
            </Link>
          </div>
        )}
      </div>,
    );
  }

  return shell(
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <header className="border-b border-[#DCE8EE] pb-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Link to={tenantRoute(activeTenantSlug, '/evidence-locker')} className="inline-flex items-center gap-2 text-[11px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#0B74DE]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Documentation
            </Link>
            <div className="mt-4 flex min-w-0 items-start gap-3">
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#DCE8EE] bg-white text-[#4D5B66]">
                <FileText className="h-4.5 w-4.5" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Document record</p>
                <h1 className="mt-1 break-words font-lora text-[26px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[32px]">{documentName}</h1>
                <p className="mt-2 text-[12px] leading-5 text-[#66737F]">{documentType} · {sourceName}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start xl:justify-end">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-normal tracking-tight', chipTone(parserChip.tone))}>
              <ParserIcon className={cn('h-3.5 w-3.5', parserStatus === 'pending' || parserStatus === 'processing' ? 'animate-spin' : '')} strokeWidth={1.7} />
              {parserChip.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#0B74DE]"
              onClick={handleTriggerParsing}
              disabled={triggeringParse}
            >
              <RefreshCw className={cn('mr-2 h-3.5 w-3.5', triggeringParse && 'animate-spin')} />
              {triggeringParse ? 'Refreshing…' : 'Refresh processing'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#0B74DE]"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
          <Tabs defaultValue="extracted" className="w-full">
            <div className="border-b border-[#DCE8EE] px-5 sm:px-6">
              <TabsList className="-mb-px flex h-auto w-full justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0">
                {[
                  { value: 'extracted', label: 'Extracted fields' },
                  { value: 'matches', label: 'Linked cases', count: matchedClaims.length },
                  { value: 'raw', label: 'Text preview' },
                  { value: 'parsing', label: 'Processing & history' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="group relative h-auto shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-0 py-3 text-[11px] font-normal tracking-tight text-[#66737F] shadow-none transition-colors hover:text-[#182026] data-[state=active]:border-[#0B74DE] data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-[#182026] data-[state=active]:shadow-none"
                  >
                    {tab.label}
                    {tab.count !== undefined ? <span className="ml-1.5 rounded-full bg-[#F1F5F7] px-1.5 py-0.5 text-[9px] font-normal text-[#66737F] group-data-[state=active]:bg-[#EDF5FF] group-data-[state=active]:text-[#0B74DE]">{tab.count}</span> : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="extracted" className="m-0 outline-none">
              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-1 border-b border-[#E7EEF2] pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">Extracted fields</h2>
                    <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Fields observed in this document. They remain subject to case-level evidence review.</p>
                  </div>
                  <span className="mt-2 text-[10px] font-medium tracking-tight text-[#66737F] sm:mt-0">{extractedDataPointCount} fields observed</span>
                </div>

                <div className="mt-5 divide-y divide-[#E7EEF2] rounded-[8px] border border-[#DCE8EE]">
                  {[
                    { label: 'Order identifiers', data: extracted.order_ids, type: 'tags' },
                    { label: 'ASIN & SKU', data: [...(extracted.asins || []), ...(extracted.skus || [])], type: 'tags' },
                    { label: 'Financial values', data: extracted.amounts, type: 'currency' },
                    { label: 'Tracking references', data: extracted.tracking_numbers, type: 'tags' },
                    { label: 'Invoice references', data: extracted.invoice_numbers, type: 'tags' },
                    { label: 'Dates', data: extracted.dates, type: 'tags' },
                  ].map((row) => (
                    <div key={row.label} className="grid gap-3 px-4 py-4 transition-colors hover:bg-[#F8FBFD] sm:grid-cols-[180px_minmax(0,1fr)] sm:px-5">
                      <p className="text-[10px] font-medium tracking-tight text-[#66737F]">{row.label}</p>
                      <div className="min-w-0">
                        {row.data?.length > 0 ? (
                          row.type === 'currency' ? (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] font-medium tracking-tight text-[#182026]">
                              {row.data.map((value: any, index: number) => <span key={`${row.label}-${index}`}>${typeof value === 'number' ? value.toFixed(2) : value}</span>)}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {row.data.map((value: any, index: number) => <span key={`${row.label}-${index}`} className="rounded-full bg-[#F1F5F7] px-2 py-1 text-[10px] font-normal leading-4 text-[#4D5B66]">{String(value)}</span>)}
                            </div>
                          )
                        ) : <span className="text-[11px] text-[#8A99A5]">Not found in this document</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="m-0 outline-none">
              <div className="min-h-[360px]">
                {matchedClaims.length > 0 ? (
                  <div className="divide-y divide-[#E7EEF2]">
                    {matchedClaims.map((match, index) => (
                      <div key={`${match.claimId || 'claim'}-${index}`} className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[#F8FBFD] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#F1F5F7] text-[#4D5B66]">
                            <Shield className="h-4 w-4" strokeWidth={1.6} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Linked recovery record</p>
                            <p className="mt-1 truncate text-[13px] font-medium tracking-tight text-[#182026]">{match.claimNumber || `Claim ${match.claimId?.slice(0, 8) || 'not available'}`}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#66737F]">
                              <span>Match: {String(match.matchType || 'Linked').replace(/_/g, ' ')}</span>
                              <span>Linked: {match.linkDate ? format(new Date(match.linkDate), 'yyyy-MM-dd HH:mm') : 'Not available'}</span>
                              <span>Type: {match.claimType || 'Not available'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={cn('rounded-full px-2 py-1 text-[10px] font-normal tracking-tight', chipTone(match.confidence != null && match.confidence >= 0.5 ? 'success' : 'neutral'))}>
                            {match.confidence != null ? `${(match.confidence * 100).toFixed(0)}% match` : 'Match confidence unavailable'}
                          </span>
                          <Button asChild variant="outline" size="sm" className="h-8 border-[#DCE8EE] bg-white px-3 text-[10px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#0B74DE]">
                            <Link to={tenantRoute(activeTenantSlug, `/recoveries/${match.claimId}`)}>Open record <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F7] text-[#66737F]"><Link2 className="h-4 w-4" strokeWidth={1.6} /></div>
                    <h2 className="mt-4 font-lora text-[20px] font-normal tracking-tight text-[#182026]">No linked recovery records</h2>
                    <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#66737F]">This document is not linked to a recovery record yet. Margin will keep its document and matching truth separate until a link is recorded.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="m-0 outline-none">
              {(() => {
                const rawText = documentData?.raw_text_preview || parsedData?.raw_text_preview;
                const lines = rawText ? rawText.split('\n') : [];
                if (!rawText) {
                  return (
                    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F7] text-[#66737F]"><FileText className="h-4 w-4" strokeWidth={1.6} /></div>
                      <h2 className="mt-4 font-lora text-[20px] font-normal tracking-tight text-[#182026]">No extracted text yet</h2>
                      <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#66737F]">Refresh artifact processing to request recorded text from the source. This action does not change the original artifact.</p>
                      <Button variant="outline" className="mt-5 h-9 border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#0B74DE]" onClick={handleTriggerParsing} disabled={triggeringParse}>
                        <RefreshCw className={cn('mr-2 h-3.5 w-3.5', triggeringParse && 'animate-spin')} />
                        {triggeringParse ? 'Refreshing…' : 'Refresh processing'}
                      </Button>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex flex-col gap-3 border-b border-[#DCE8EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <h2 className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">Text preview</h2>
                        <p className="mt-1 text-[11px] text-[#66737F]">{lines.length} extracted lines</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rawText);
                          toast({ title: 'Text copied', description: 'The extracted text preview was copied to your clipboard.' });
                        }}
                        className="inline-flex items-center gap-1.5 self-start text-[11px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#075EA8]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy text
                      </button>
                    </div>
                    <div className="grid max-h-[560px] overflow-auto bg-[#FBFCFD] font-mono text-[11px] leading-5 sm:grid-cols-[56px_minmax(0,1fr)]">
                      <div className="hidden select-none border-r border-[#E7EEF2] bg-[#F5F8FA] py-5 text-right text-[#9AA8B2] sm:block">
                        {lines.map((_: string, index: number) => <div key={index} className="h-5 pr-4">{index + 1}</div>)}
                      </div>
                      <div className="min-w-0 whitespace-pre-wrap px-5 py-5 text-[#4D5B66]">
                        {lines.map((text: string, index: number) => <div key={index} className="min-h-5 rounded px-1 transition-colors hover:bg-[#EDF5FF]">{text || ' '}</div>)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="parsing" className="m-0 outline-none">
              <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                {docId ? <ParsingStatus documentId={docId} autoPoll={false} documentData={documentData} onRefresh={() => fetchDocumentDetail(false)} /> : null}
                <section className="overflow-hidden rounded-[8px] border border-[#DCE8EE]">
                  <div className="flex items-center justify-between border-b border-[#E7EEF2] bg-[#F7FAFC] px-4 py-3">
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-tight text-[#4D5B66]"><Clock className="h-3.5 w-3.5" /> Document history</div>
                    <span className="text-[10px] text-[#66737F]">{documentHistory.length} events</span>
                  </div>
                  {documentHistory.length > 0 ? (
                    <div className="divide-y divide-[#E7EEF2] bg-white">
                      {documentHistory.map((event, index) => (
                        <div key={event.id || index} className="px-4 py-4">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[11px] font-medium tracking-tight text-[#182026]">{String(event.eventType || 'Unknown event').replace(/_/g, ' ')}</p>
                            <span className="text-[10px] text-[#8A99A5]">{event.timestamp ? format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'Not available'}</span>
                          </div>
                          <p className="mt-2 text-[12px] leading-5 text-[#4D5B66]">{event.narrative || 'No event narrative recorded.'}</p>
                          {event.actor ? <p className="mt-2 text-[10px] text-[#66737F]">Actor: {event.actor}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : <div className="bg-white px-4 py-8 text-center text-[11px] text-[#66737F]">No document history is recorded yet.</div>}
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Evidence position</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <h2 className="font-lora text-[21px] font-normal tracking-tight text-[#182026]">{evidenceDecision.label}</h2>
              <span className={cn('rounded-full px-2 py-1 text-[10px] font-normal tracking-tight', chipTone(evidenceDecision.usable ? 'success' : parserStatus === 'failed' ? 'danger' : 'neutral'))}>{evidenceDecision.usable ? 'Usable in review' : 'Not filing proof'}</span>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[#4D5B66]">{evidenceDecision.reason}</p>
            <div className="mt-4 border-t border-[#E7EEF2] pt-4">
              <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Next justified step</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#66737F]">{evidenceDecision.nextStep}</p>
            </div>
          </section>

          <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Extraction summary</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] text-[#8A99A5]">Recorded detail confidence</p><p className="mt-1 text-[20px] font-medium tracking-tight text-[#182026]">{parserConfidenceLabel}</p><p className="mt-1 text-[10px] leading-4 text-[#66737F]">This does not establish proof or a recovery outcome.</p></div><span className={cn('mb-1 h-2 w-2 rounded-full', parserConfidence != null ? 'bg-[#0B74DE]' : 'bg-[#B8C4CE]')} /></div>
              <div className="border-t border-[#E7EEF2] pt-4"><p className="text-[10px] text-[#8A99A5]">Artifact processing</p><p className="mt-1 text-[12px] font-medium tracking-tight text-[#182026]">{parsingTruth.strategy === 'FULL' ? 'Full artifact review recorded' : parsingTruth.strategy === 'PARTIAL' ? 'Partial artifact review recorded' : parsingTruth.strategy === 'FAILED_DURABLE' ? 'Artifact review could not be completed' : parserStatus === 'pending' || parserStatus === 'processing' ? 'Artifact review in progress' : 'Processing method not recorded'}</p><p className="mt-1.5 text-[11px] leading-5 text-[#66737F]">{parsingTruth.explanation?.reason || 'No artifact-processing explanation recorded.'}</p></div>
              {parsingTruth.operationalState ? <div className="border-t border-[#E7EEF2] pt-4"><p className="text-[10px] text-[#8A99A5]">Current processing state</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">{formatAutonomyLabel(parsingTruth.operationalState)}{parsingOperationalSummary ? ` · ${parsingOperationalSummary}` : ''}</p></div> : null}
              {ingestionTruth.strategy ? <div className="border-t border-[#E7EEF2] pt-4"><p className="text-[10px] text-[#8A99A5]">Intake source</p><p className="mt-1 text-[11px] text-[#4D5B66]">{formatAutonomyLabel(ingestionTruth.strategy)}</p></div> : null}
            </div>
          </section>

          <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Document provenance</p>
            <dl className="mt-4 space-y-4">
              {metadataItems.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A99A5]" strokeWidth={1.6} />
                  <div className="min-w-0"><dt className="text-[10px] text-[#8A99A5]">{item.label}</dt><dd className="mt-1 break-words text-[11px] leading-5 text-[#4D5B66]">{item.value}</dd></div>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>,
  );
}
