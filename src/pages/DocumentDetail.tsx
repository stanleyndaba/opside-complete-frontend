import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Check,
  Download,
  RefreshCw,
  Cloud,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  Eye,
  Sparkles,
  Hexagon,
  Copy,
  Square,
  Activity,
  Shield,
  Search,
  Database,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';
import { formatAutonomyLabel, getIngestionTruth, getParsingTruth, summarizeOperationalExplanation } from '@/lib/autonomyTruth';

export default function DocumentDetail() {
  const { id, documentId, tenantSlug } = useParams();
  const { tenant, isReady } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug;
  if (!activeTenantSlug && isReady) {
    throw new Error("tenantSlug required for DocumentDetail");
  }
  const docId = (documentId as string) || (id as string) || '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const mainClass = useMemo(() => {
    return isSidebarCollapsed ? 'ml-16' : 'ml-64';
  }, [isSidebarCollapsed]);

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
        api.getDocumentAuditTrail(docId, activeTenantSlug)
      ]);

      if (docRes.ok && docRes.data) {
        setDocumentData(docRes.data);
        setParsedData(docRes.data.parsed_metadata || null);
        setError(null);
      } else {
        setError(docRes.error || 'Failed to load document');
      }

      if (linkedClaimsRes.ok && linkedClaimsRes.data?.linkedClaims) {
        setMatchedClaims(linkedClaimsRes.data.linkedClaims);
      } else {
        setMatchedClaims([]);
      }

      if (auditRes.ok && auditRes.data?.events) {
        const events = [...auditRes.data.events].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setDocumentHistory(events);
      } else {
        setDocumentHistory([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load document');
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
      const res = await api.reparseDocument(docId, activeTenantSlug);
      if (res.ok) {
        await fetchDocumentDetail(false);
        toast({
          title: 'Parsing Triggered',
          description: 'Document parsing has been initiated. The page will refresh from backend truth.',
        });
      } else {
        toast({
          title: 'Failed to Trigger Parsing',
          description: res.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to trigger parsing',
        variant: 'destructive',
      });
    } finally {
      setTriggeringParse(false);
    }
  };

  const getParserStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <div className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] font-sans font-bold text-white/80 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <CheckCircle2 className="w-3 h-3" />
            FULL_PARSE
          </div>
        );
      case 'partial':
        return (
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[10px] font-sans font-bold text-amber-400 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <AlertCircle className="w-3 h-3" />
            PARTIAL_PARSE
          </div>
        );
      case 'pending':
      case 'processing':
        return (
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[10px] font-sans font-bold text-amber-500 uppercase tracking-tight flex items-center gap-1.5 rounded-sm animate-pulse">
            <Clock className="w-3 h-3" />
            PROCESSING
          </div>
        );
      case 'failed':
        return (
          <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-[10px] font-sans font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </div>
        );
      default:
        return (
          <div className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <Activity className="w-3 h-3" />
            {status || 'UNKNOWN'}
          </div>
        );
    }
  };

  const extracted = documentData?.extracted || parsedData?.extracted || {};
  const parsingTruth = getParsingTruth(documentData || {});
  const ingestionTruth = getIngestionTruth(documentData || {});
  const parserConfidence = parsingTruth.confidence;
  const parserConfidenceLabel = parserConfidence != null
    ? `${(parserConfidence * 100).toFixed(0)}%`
    : 'Unknown';
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
        label: 'NO',
        reason: parsingOperationalSummary || 'Parsing is still in progress',
        nextStep: parsingTruth.operationalExplanation?.next_action
          ? formatAutonomyLabel(parsingTruth.operationalExplanation.next_action)
          : 'Wait for parsing to complete before using this document as evidence.'
      };
    }
    if (status === 'failed') {
      return {
        usable: false,
        label: 'NO',
        reason: parsingOperationalSummary || documentData?.parser_error || 'Parsing failed',
        nextStep: parsingTruth.operationalExplanation?.next_action
          ? formatAutonomyLabel(parsingTruth.operationalExplanation.next_action)
          : 'Re-run parsing or manually review the source document.'
      };
    }
    if (extractedDataPointCount === 0 && !(parsedData?.line_items?.length > 0)) {
      return { usable: false, label: 'NO', reason: 'No structured fields were extracted', nextStep: 'Review the file manually or re-run parsing with a better source document.' };
    }
    if (matchedClaims.length === 0) {
      return { usable: false, label: 'NO', reason: 'Not linked to any case yet', nextStep: 'Wait for matching or link this document to the correct case manually.' };
    }
    if (status === 'partial') {
      return {
        usable: false,
        label: 'LIMITED',
        reason: parsingTruth.explanation?.reason || 'The parser preserved some usable truth, but this document is only partially parsed.',
        nextStep: 'Review the preserved fields before using this document in a filing decision.'
      };
    }
    if (parserConfidence == null) {
      return { usable: false, label: 'NO', reason: 'Extraction confidence is unknown', nextStep: 'Review extracted fields manually before relying on this as evidence.' };
    }
    if (parserConfidence < 0.5) {
      return { usable: false, label: 'NO', reason: 'Extraction confidence is low', nextStep: 'Manual review is required before this document supports filing.' };
    }
    return { usable: true, label: 'YES', reason: 'Structured extraction completed and linked to a case', nextStep: 'Document can support case review and filing readiness checks.' };
  })();

  if (loading || error) {
    return (
      <div className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
        <div className="flex-1 flex h-full overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-sans', mainClass)}>
            <div className="flex items-center justify-center min-h-[500px]">
              {loading ? (
                <div className="text-center">
                  <div className="relative flex h-8 w-8 mx-auto mb-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/20 opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-white/10 border border-white/10"></span>
                  </div>
                  <div className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight">LOADING...</div>
                </div>
              ) : (
                <div className="text-center p-12 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto text-rose-500/20 mb-6" />
                  <div className="text-sm font-sans font-bold text-rose-500 uppercase tracking-tight mb-4">LOAD_FAILURE</div>
                  <div className="text-xs text-rose-500/40 mb-8 font-sans font-bold tracking-tight">{error}</div>
                  <Link to={tenantRoute(activeTenantSlug, '/evidence-locker')}>
                    <Button variant="ghost" className="text-[11px] font-sans font-bold text-white/40 hover:text-white border border-white/5 hover:border-white/10 tracking-tight">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      RETURN_TO_DOCUMENTS
                    </Button>
                  </Link>
                </div>
              )}
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

              {/* Analysis Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                  <Link to={tenantRoute(activeTenantSlug, '/evidence-locker')}>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-white/20 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight uppercase">DOCUMENT_DETAILS</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-sans font-bold text-white tracking-tight uppercase">
                        {documentData?.name?.replace(' ', '_') || 'UNNAMED_DOCUMENT'}
                      </h1>
                      <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getParserStatusBadge(parsingTruth.status)}
                  <div className="h-6 w-[1px] bg-white/10 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-5 text-[10px] font-sans font-bold text-white/40 hover:text-blue-400 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 transition-all uppercase tracking-tight rounded-lg"
                    onClick={handleTriggerParsing}
                    disabled={triggeringParse}>
                    {triggeringParse ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                    {triggeringParse ? 'PROCESSING...' : 'REFRESH_DATA'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-5 text-[10px] font-sans font-bold text-white/40 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all uppercase tracking-tight rounded-lg"
                    onClick={async () => {
                      if (!docId) return;
                      try {
                        const response = await api.getDocumentDownload(docId, activeTenantSlug);
                        if (response.ok && response.data?.url) {
                          window.open(response.data.url, '_blank');
                        } else {
                          toast({ title: 'Download Failed', description: response.error || 'Could not get download URL', variant: 'destructive' });
                        }
                      } catch (err: any) {
                        toast({ title: 'Download Error', description: err?.message || 'Failed to download', variant: 'destructive' });
                      }
                    }}>
                    <Download className="w-3.5 h-3.5 mr-2" />
                    DOWNLOAD
                  </Button>
                </div>
              </div>

              {/* Main Matrix Tabs */}
              <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                <Tabs defaultValue="extracted" className="p-0">
                      <div className="px-8 bg-white/[0.02] border-b border-white/5">
                        <TabsList className="flex h-16 items-center justify-start gap-12 bg-transparent rounded-none p-0 overflow-x-auto scrollbar-hide">
                          {[
                        { value: 'extracted', label: 'EXTRACTED_DATA' },
                        { value: 'matches', label: 'LINKED_CASES', count: matchedClaims.length },
                        { value: 'raw', label: 'TEXT_PREVIEW' },
                            { value: 'parsing', label: 'STATUS' }
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative h-16 px-0 text-[11px] font-sans font-bold text-white/20 bg-transparent data-[state=active]:bg-transparent rounded-none border-0 shadow-none transition-all hover:text-white group data-[state=active]:text-blue-400 uppercase tracking-tight"
                        >
                          <div className="flex items-center gap-2.5">
                            {tab.label}
                            {tab.count !== undefined && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-full text-white/40 group-data-[state=active]:bg-blue-500/10 group-data-[state=active]:text-blue-400">
                                {tab.count}
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 opacity-0 group-data-[state=active]:opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.45)] transition-all" />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Extracted Intelligence Tab - Two-Column Key-Value Layout */}
                  <TabsContent value="extracted" className="p-0 m-0 outline-none">
                    <div className="flex flex-col">
                      {/* Header */}
                      <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">INTELLIGENCE_STREAM</span>
                          <div className="h-3 w-[1px] bg-white/10 mx-2" />
                          <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight">FORENSIC_DATA_POINTS</span>
                        </div>
                      </div>

                      {/* Two-Column Key-Value Table */}
                      <div className="px-8 py-6">
                        <div className="border border-white/5 rounded-lg overflow-hidden bg-white/[0.01]">
                          {[ 
                            { id: '01', label: 'ORDER_IDENTIFIERS', data: extracted.order_ids, type: 'tags' },
                            { id: '02', label: 'ASIN_SKU_RESOURCES', data: [...(extracted.asins || []), ...(extracted.skus || [])], type: 'tags' },
                            { id: '03', label: 'FINANCIAL_VALUES', data: extracted.amounts, type: 'currency' },
                            { id: '04', label: 'LOGISTICS_TRACKING', data: extracted.tracking_numbers, type: 'tags' },
                            { id: '05', label: 'INVOICE_REFERENCES', data: extracted.invoice_numbers, type: 'tags' },
                            { id: '06', label: 'TEMPORAL_MARKERS', data: extracted.dates, type: 'tags' }
                          ].map((row, idx) => (
                            <div
                              key={row.id}
                              className={cn(
                                "group flex items-start hover:bg-white/[0.02] transition-all",
                                idx !== 5 && "border-b border-white/5"
                              )}
                            >
                              {/* Left Column - Label */}
                              <div className="w-[220px] flex-shrink-0 px-5 py-4 bg-white/[0.02] border-r border-white/5 flex items-center">
                                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight group-hover:text-white/60 transition-colors">
                                  {row.label}
                                </span>
                              </div>

                              {/* Right Column - Values */}
                              <div className="flex-1 px-5 py-4 flex items-center flex-wrap gap-2">
                                {row.data?.length > 0 ? (
                                  row.type === 'currency' ? (
                                    // Financial values - larger, emphasized
                                    <div className="flex items-center gap-3">
                                      {row.data.map((val: any, i: number) => (
                                        <React.Fragment key={i}>
                                          <span className="text-base font-sans font-bold text-white tracking-tight">
                                            ${typeof val === 'number' ? val.toFixed(2) : val}
                                          </span>
                                          {i < row.data.length - 1 && (
                                            <span className="text-white/10">·</span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  ) : (
                                    // Regular values - inline with separator
                                    <span className="text-[12px] font-sans font-bold text-white/70 tracking-tight">
                                      {row.data.map((val: any, i: number) => (
                                        <React.Fragment key={i}>
                                          <span className="hover:text-white transition-colors cursor-default">{val}</span>
                                          {i < row.data.length - 1 && (
                                            <span className="text-white/20 mx-2">·</span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] font-sans font-bold text-white/10 uppercase tracking-tight">—</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Stats */}
                      <div className="px-8 pb-8 flex items-center justify-between">
                        <div className="flex items-center gap-10">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">EXTRACT_CONFIDENCE</span>
                            <div className="flex items-center gap-2">
                              <div className={cn("h-1.5 w-1.5 rounded-full", parserConfidence != null ? "bg-blue-400" : "bg-white/20")} />
                              <span className={cn("text-lg font-sans font-bold tracking-tight", parserConfidence != null ? "text-white" : "text-white/60")}>
                                {parserConfidenceLabel}
                              </span>
                            </div>
                          </div>

                          <div className="h-8 w-[1px] bg-white/5" />

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">PARSE_STRATEGY</span>
                            <span className={cn("text-lg font-sans font-bold tracking-tight", parsingTruth.status === 'failed' ? "text-rose-400" : parsingTruth.status === 'partial' ? "text-amber-400" : "text-white/80")}>
                              {formatAutonomyLabel(parsingTruth.strategy || parsingTruth.status)}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight">
                              {parsingTruth.explanation?.reason || 'No parser explanation recorded.'}
                            </span>
                            {parsingTruth.operationalState ? (
                              <span className="text-[10px] font-sans font-bold text-amber-100/60 tracking-tight">
                                Runtime: {formatAutonomyLabel(parsingTruth.operationalState)}
                                {parsingOperationalSummary ? ` · ${parsingOperationalSummary}` : ''}
                              </span>
                            ) : null}
                          </div>

                          <div className="h-8 w-[1px] bg-white/5" />

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">USABLE_AS_EVIDENCE</span>
                            <span className={cn("text-lg font-sans font-bold tracking-tight", evidenceDecision.usable ? "text-white" : "text-rose-400")}>
                              {evidenceDecision.label}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight">{evidenceDecision.reason}</span>
                          </div>

                          <div className="h-8 w-[1px] bg-white/5" />

                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">DATA_POINTS</span>
                            <span className="text-lg font-sans font-bold text-white/60 tracking-tight">
                              {(extracted.order_ids?.length || 0) +
                                (extracted.asins?.length || 0) +
                                (extracted.skus?.length || 0) +
                                (extracted.amounts?.length || 0) +
                                (extracted.tracking_numbers?.length || 0) +
                                (extracted.invoice_numbers?.length || 0) +
                                (extracted.dates?.length || 0)}
                            </span>
                            {ingestionTruth.strategy ? (
                              <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight">
                                Intake: {formatAutonomyLabel(ingestionTruth.strategy)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="max-w-sm text-right">
                          <div className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mb-1">NEXT_STEP</div>
                          <div className="text-[11px] font-sans font-bold text-white/60 tracking-tight leading-relaxed">
                            {evidenceDecision.nextStep}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Linked Objects Tab */}
                  <TabsContent value="matches" className="p-0 m-0 outline-none">
                    <div className="flex flex-col min-h-[400px]">
                      {matchedClaims.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {matchedClaims.map((match, idx) => (
                            <div key={idx} className="group relative flex items-center justify-between py-8 px-8 hover:bg-white/[0.02] transition-all duration-300">
                              <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.45)] opacity-0 group-hover:opacity-100 transition-opacity" />

                              <div className="flex items-start gap-8">
                                <div className="mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
                                  <Shield className="h-5 w-5 text-white/70" />
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">ASSOCIATED_CLAIM</span>
                                      <span className="text-sm font-sans font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                        {match.claimNumber || `CLAIM_${match.claimId?.slice(0, 8)}`}
                                      </span>
                                    </div>
                                    <div className="h-8 w-[1px] bg-white/5" />
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">MATCH_METHOD</span>
                                      <span className="text-xs font-sans font-bold text-white/60 tracking-tight">
                                        {match.matchType?.replace(/_/g, ' ') || 'LINKED'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-[10px] font-sans font-bold text-blue-400 uppercase tracking-tight rounded-full">
                                      {match.confidence != null ? `${(match.confidence * 100).toFixed(0)}%_CONFIDENCE` : 'UNKNOWN_CONFIDENCE'}
                                    </div>
                                    <div className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">
                                      CASE_TYPE: <span className="text-white/60">{match.claimType || 'UNKNOWN'}</span>
                                    </div>
                                  </div>

                                  <div className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">
                                    LINKED_AT: <span className="text-white/60">{match.linkDate ? format(new Date(match.linkDate), 'yyyy-MM-dd HH:mm') : 'UNKNOWN'}</span>
                                  </div>
                                </div>
                              </div>

                              <Link to={tenantRoute(activeTenantSlug, `/recoveries/${match.claimId}`)}>
                                <Button variant="ghost" className="h-12 px-6 text-[11px] font-sans font-bold text-white/20 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all uppercase tracking-tight group/btn">
                                  VIEW_CLAIM
                                  <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-32">
                          <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-8">
                            <Link2 className="h-8 w-8 text-white/10" />
                          </div>
                          <span className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight">NO_LINKED_CASES</span>
                          <p className="text-xs text-white/10 mt-4 font-sans font-bold uppercase tracking-tight">This document is not linked to a case yet.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Forensic Stream Tab */}
                  <TabsContent value="raw" className="p-0 m-0 outline-none">
                    <div className="flex flex-col min-h-[400px]">
                      {(() => {
                        const rawText = documentData?.raw_text_preview || parsedData?.raw_text_preview;
                        const lines = rawText ? rawText.split('\n') : [];

                        if (!rawText) return (
                          <div className="flex flex-col items-center justify-center py-32">
                            <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-8">
                              <Terminal className="h-8 w-8 text-white/10" />
                            </div>
                            <span className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight">NO_EXTRACTED_TEXT_AVAILABLE</span>
                            <Button
                              variant="ghost"
                              className="mt-8 text-[11px] font-sans font-bold text-white/40 hover:text-blue-400 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/20 uppercase tracking-tight"
                              onClick={handleTriggerParsing}
                              disabled={triggeringParse}
                            >
                              EXTRACT_DATA
                            </Button>
                          </div>
                        );

                        return (
                          <>
                            <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Terminal className="h-3.5 w-3.5 text-white/70" />
                                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">PREVIEW_OF_EXTRACTED_TEXT</span>
                                <div className="h-3 w-[1px] bg-white/10 mx-2" />
                                <span className="text-[10px] font-sans font-bold text-white/30 tracking-tight">{lines.length} LINES</span>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(rawText);
                                  toast({ title: 'Stream Data Copied', description: 'Raw intelligence output has been copied to clipboard.' });
                                }}
                                className="text-[10px] font-sans font-bold text-white/20 hover:text-blue-400 transition-colors uppercase tracking-tight flex items-center gap-2"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                COPY_ALL
                              </button>
                            </div>

                            <div className="font-sans font-bold text-xs leading-relaxed max-h-[800px] overflow-hidden tracking-tight">
                              {/* Line Numbers */}
                              <div className="bg-[#080808] border-r border-white/5 p-6 text-right select-none text-white/10 min-w-[4rem]">
                                {lines.map((_, i) => (
                                  <div key={i} className="h-5">{(i + 1).toString().padStart(3, '0')}</div>
                                ))}
                              </div>
                              {/* Content */}
                              <div className="flex-1 overflow-auto p-6 text-white/60 whitespace-pre scrollbar-thin scrollbar-thumb-white/10">
                                {lines.map((text, i) => (
                                  <div key={i} className="h-5 hover:bg-white/[0.03] transition-colors px-2 -mx-2 rounded-sm group relative">
                                    <div className="absolute left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100" />
                                    {text || ' '}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </TabsContent>

                  {/* Node Status Tab */}
                  <TabsContent value="parsing" className="p-8 m-0 outline-none">
                    <div className="max-w-4xl mx-auto space-y-8">
                      {docId && (
                        <ParsingStatus
                          documentId={docId}
                          autoPoll={false}
                          documentData={documentData}
                          onRefresh={() => fetchDocumentDetail(false)}
                        />
                      )}

                      <div className="rounded-xl border border-white/5 overflow-hidden shadow-2xl">
                        <div className="bg-white/[0.03] border-b border-white/10 py-5 px-6 flex items-center justify-between backdrop-blur-md">
                          <div className="flex items-center gap-4">
                            <Clock className="w-3.5 h-3.5 text-white/70" />
                            <h4 className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">DOCUMENT_HISTORY</h4>
                          </div>
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">
                            {documentHistory.length} EVENTS
                          </span>
                        </div>

                        <div className="bg-[#0a0a0a] p-6">
                          {documentHistory.length > 0 ? (
                            <div className="space-y-4">
                              {documentHistory.map((event) => (
                                <div key={event.id} className="border border-white/5 rounded-lg p-4 bg-white/[0.02]">
                                  <div className="flex items-center justify-between gap-4 mb-2">
                                    <span className="text-[10px] font-sans font-bold text-white/80 uppercase tracking-tight">
                                      {String(event.eventType || 'unknown').replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">
                                      {event.timestamp ? format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'UNKNOWN'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-sans font-bold text-white/70 tracking-tight leading-relaxed">
                                    {event.narrative}
                                  </p>
                                  {event.actor && (
                                    <div className="mt-2 text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">
                                      Actor: <span className="text-white/60 normal-case">{event.actor}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10">
                              <span className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight">NO_DOCUMENT_HISTORY</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Registry Metadata Footer */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: 'DOCUMENT_ID', value: docId, icon: Hash },
                  { label: 'DOCUMENT_TYPE', value: documentData?.content_type || documentData?.type || 'Not available', icon: Database },
                  { label: 'SOURCE', value: documentData?.source || documentData?.provider || 'Not available', icon: Cloud },
                  { label: 'CREATED_AT', value: documentData?.created_at ? format(new Date(documentData.created_at), 'yyyy-MM-dd HH:mm:ss') : 'Not available', icon: Calendar }
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <item.icon className="h-3.5 w-3.5 text-white/20 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <div className="font-sans font-bold text-[11px] text-white/60 group-hover:text-white transition-colors truncate tracking-tight">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
