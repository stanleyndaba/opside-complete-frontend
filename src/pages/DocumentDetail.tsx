import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  Mail,
  Cloud,
  Calendar,
  Package,
  Truck,
  DollarSign,
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
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

export default function DocumentDetail() {
  const { id, documentId } = useParams();
  const docId = (documentId as string) || (id as string) || '';

  const [documentData, setDocumentData] = useState<any | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [matchedClaims, setMatchedClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggeringParse, setTriggeringParse] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { toast } = useToast();

  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const mainClass = useMemo(() => {
    return isSidebarCollapsed ? 'ml-16' : 'ml-64';
  }, [isSidebarCollapsed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docId) return;
      setLoading(true);
      try {
        // Fetch document data (backend now returns all parsed data in one call)
        console.log('[DocumentDetail] Fetching document:', docId);
        const docRes = await api.getDocument(docId);

        console.log('[DocumentDetail] Response:', docRes);

        if (!cancelled) {
          if (docRes.ok && docRes.data) {
            console.log('[DocumentDetail] Document data:', docRes.data);
            setDocumentData(docRes.data as any);
            setParsedData(docRes.data); // Same data now includes parsed fields
            setError(null);
          } else {
            console.error('[DocumentDetail] Failed to load document:', docRes.error);
            setError(docRes.error || 'Failed to load document');
          }

          // Fetch matched claims for this document
          try {
            const matchRes = await api.getDocumentMatchingResults(docId);
            if (matchRes.ok && matchRes.data?.results) {
              setMatchedClaims(matchRes.data.results);
            }
          } catch (e) {
            console.log('No matching results for document');
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load document');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [docId]);

  const handleTriggerParsing = async () => {
    if (!docId) return;
    setTriggeringParse(true);
    try {
      const res = await api.reparseDocument(docId);
      if (res.ok) {
        toast({
          title: 'Parsing Triggered',
          description: 'Document parsing has been initiated. Refresh to see results.',
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

  const getSourceIcon = (source: string) => {
    const lower = source?.toLowerCase() || '';
    if (lower.includes('gmail') || lower.includes('email')) return <Mail className="w-3.5 h-3.5" />;
    if (lower.includes('drive') || lower.includes('dropbox')) return <Cloud className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
  };

  const getParserStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
            <CheckCircle2 className="w-3 h-3" />
            VALIDATED
          </div>
        );
      case 'pending':
        return (
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 rounded-sm animate-pulse">
            <Clock className="w-3 h-3" />
            PROCESSING
          </div>
        );
      case 'failed':
        return (
          <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </div>
        );
      default:
        return (
          <div className="px-2.5 py-1 bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
            <Activity className="w-3 h-3" />
            {status || 'UNKNOWN'}
          </div>
        );
    }
  };

  const extracted = documentData?.extracted || parsedData?.extracted || {};

  if (loading || error) {
    return (
      <div className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
        <div className="flex-1 flex h-full overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
            <div className="flex items-center justify-center min-h-[500px]">
              {loading ? (
                <div className="text-center">
                  <div className="relative flex h-8 w-8 mx-auto mb-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500/40"></span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">LOADING...</div>
                </div>
              ) : (
                <div className="text-center p-12 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto text-rose-500/20 mb-6" />
                  <div className="text-sm font-mono font-bold text-rose-500 uppercase tracking-widest mb-4">LOAD_FAILURE</div>
                  <div className="text-xs text-rose-500/40 mb-8 font-mono">{error}</div>
                  <Link to="/evidence-locker">
                    <Button variant="ghost" className="text-[11px] font-mono font-bold text-white/40 hover:text-white border border-white/5 hover:border-white/10">
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
                  <Link to="/evidence-locker">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-white/20 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-500/50 tracking-[0.3em] uppercase">DOCUMENT_DETAILS</span>
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-serif font-medium text-white tracking-tight uppercase">
                        {documentData?.name?.replace(' ', '_') || 'UNNAMED_DOCUMENT'}
                      </h1>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getParserStatusBadge(documentData?.parser_status || parsedData?.parser_status)}
                  <div className="h-6 w-[1px] bg-white/10 mx-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-5 text-[10px] font-mono font-bold text-white/40 hover:text-emerald-500 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all uppercase tracking-widest rounded-lg"
                    onClick={handleTriggerParsing}
                    disabled={triggeringParse}>
                    {triggeringParse ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                    {triggeringParse ? 'PROCESSING...' : 'REFRESH_DATA'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-5 text-[10px] font-mono font-bold text-white/40 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all uppercase tracking-widest rounded-lg"
                    onClick={async () => {
                      if (!docId) return;
                      try {
                        const response = await api.getDocumentDownload(docId);
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
                    <TabsList className="flex h-16 items-center justify-start gap-12 bg-transparent rounded-none p-0 overflow-x-auto no-scrollbar">
                      {[
                        { value: 'extracted', label: 'EXTRACTED_DATA', icon: Database },
                        { value: 'matches', label: 'MATCHED_CLAIMS', icon: Link2, count: matchedClaims.length },
                        { value: 'raw', label: 'RAW_DATA', icon: Terminal },
                        { value: 'parsing', label: 'STATUS', icon: Activity }
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative h-16 px-0 text-[11px] font-mono font-bold text-white/20 bg-transparent data-[state=active]:bg-transparent rounded-none border-0 shadow-none transition-all hover:text-white group data-[state=active]:text-emerald-500 uppercase tracking-widest"
                        >
                          <div className="flex items-center gap-2.5">
                            <tab.icon className="h-3.5 w-3.5 opacity-40 group-data-[state=active]:opacity-100" />
                            {tab.label}
                            {tab.count !== undefined && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-full text-white/40 group-data-[state=active]:bg-emerald-500/10 group-data-[state=active]:text-emerald-500">
                                {tab.count}
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 opacity-0 group-data-[state=active]:opacity-100 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all" />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Extracted Intelligence Tab */}
                  <TabsContent value="extracted" className="p-8 m-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Identification Data */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Hash className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-6">IDENTIFICATION</h4>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">Order_IDs</span>
                            <div className="flex flex-wrap gap-2">
                              {extracted.order_ids?.length > 0 ? extracted.order_ids.map((id: string, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-xs font-mono text-white/80">{id}</div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">ASINs_SKUs</span>
                            <div className="flex flex-wrap gap-2">
                              {[...(extracted.asins || []), ...(extracted.skus || [])].length > 0 ? [...(extracted.asins || []), ...(extracted.skus || [])].map((id: string, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-xs font-mono text-white/80">{id}</div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial/Tracking Data */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <DollarSign className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-6">FINANCIAL_DATA</h4>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">Amounts_Extracted</span>
                            <div className="flex flex-wrap gap-2">
                              {extracted.amounts?.length > 0 ? extracted.amounts.map((amt: any, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-xs font-mono font-bold text-emerald-500">
                                  ${typeof amt === 'number' ? amt.toFixed(2) : amt}
                                </div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">Tracking_Numbers</span>
                            <div className="flex flex-wrap gap-2">
                              {extracted.tracking_numbers?.length > 0 ? extracted.tracking_numbers.map((num: string, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-xs font-mono text-white/80">{num}</div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Verification Context */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-6">DATES_AND_REFERENCES</h4>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">Invoice_References</span>
                            <div className="flex flex-wrap gap-2">
                              {extracted.invoice_numbers?.length > 0 ? extracted.invoice_numbers.map((inv: string, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-xs font-mono text-white/80">{inv}</div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <span className="text-[10px] font-mono text-white/20 uppercase">Detected_Timestamps</span>
                            <div className="flex flex-wrap gap-2">
                              {extracted.dates?.length > 0 ? extracted.dates.map((date: string, i: number) => (
                                <div key={i} className="px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-md text-xs font-mono text-white/80">{date}</div>
                              )) : <span className="text-xs font-mono text-white/10 uppercase">NOT_FOUND</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono font-bold text-white/20 uppercase">CONFIDENCE_SCORE</span>
                          <span className="text-xl font-mono font-bold text-emerald-500">
                            {documentData?.parser_confidence !== undefined ? `${(documentData.parser_confidence * 100).toFixed(0)}%_MATCH` : 'PENDING'}
                          </span>
                        </div>
                        <div className="h-10 w-[1px] bg-white/5" />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono font-bold text-white/20 uppercase">TOTAL_FIELDS</span>
                          <span className="text-xl font-mono font-bold text-white">
                            {(extracted.order_ids?.length || 0) + (extracted.asins?.length || 0) + (extracted.tracking_numbers?.length || 0) + (extracted.amounts?.length || 0)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 px-6 text-[11px] font-mono font-bold text-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all uppercase tracking-widest rounded-lg"
                        onClick={() => setSummaryOpen(!summaryOpen)}
                      >
                        {summaryOpen ? 'CLOSE_VIEW' : 'VIEW_SUMMARY'}
                        <ChevronRight className={cn("ml-2 h-4 w-4 transition-transform", summaryOpen ? "rotate-90" : "")} />
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Linked Objects Tab */}
                  <TabsContent value="matches" className="p-0 m-0 outline-none">
                    <div className="flex flex-col min-h-[400px]">
                      {matchedClaims.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {matchedClaims.map((match, idx) => (
                            <div key={idx} className="group relative flex items-center justify-between py-8 px-8 hover:bg-white/[0.02] transition-all duration-300">
                              <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />

                              <div className="flex items-start gap-8">
                                <div className="mt-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
                                  <Shield className="h-5 w-5 text-emerald-500" />
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-mono font-bold text-white/20 uppercase">ASSOCIATED_CLAIM</span>
                                      <span className="text-sm font-mono font-bold text-white group-hover:text-emerald-500 transition-colors uppercase">
                                        CLAIM_{match.claim_id?.slice(0, 8)}
                                      </span>
                                    </div>
                                    <div className="h-8 w-[1px] bg-white/5" />
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-mono font-bold text-white/20 uppercase">MATCH_METHOD</span>
                                      <span className="text-xs font-mono font-medium text-white/60">
                                        {match.match_type?.replace(/_/g, ' ') || 'FUZZY_MATCH'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest rounded-full">
                                      {(match.confidence_score * 100).toFixed(0)}%_CONFIDENCE
                                    </div>
                                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                                      DATA_POINTS: <span className="text-white/60">{match.matched_fields?.join(', ') || 'NONE'}</span>
                                    </div>
                                  </div>

                                  {match.reasoning && (
                                    <div className="flex gap-4 p-4 bg-white/[0.01] border border-white/5 rounded-xl max-w-2xl">
                                      <div className="mt-1"><Terminal className="h-3.5 w-3.5 text-white/20" /></div>
                                      <p className="text-[11px] text-white/40 font-mono leading-relaxed italic">
                                        "{match.reasoning}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Link to={`/case/${match.claim_id}`}>
                                <Button variant="ghost" className="h-12 px-6 text-[11px] font-mono font-bold text-white/20 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all uppercase tracking-[0.2em] group/btn">
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
                          <span className="text-[11px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">NO_MATCHED_CLAIMS</span>
                          <p className="text-xs text-white/10 mt-4 font-mono uppercase tracking-widest">Awaiting match engine synchronization...</p>
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
                            <span className="text-[11px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">NO_DATA_FOUND</span>
                            <Button
                              variant="ghost"
                              className="mt-8 text-[11px] font-mono font-bold text-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/10 uppercase tracking-widest"
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
                                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">DOCUMENT_STREAM</span>
                                <div className="h-3 w-[1px] bg-white/10 mx-2" />
                                <span className="text-[10px] font-mono text-emerald-500/50">{lines.length} LINES</span>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(rawText);
                                  toast({ title: 'Stream Data Copied', description: 'Raw intelligence output has been copied to clipboard.' });
                                }}
                                className="text-[10px] font-mono font-bold text-white/20 hover:text-emerald-500 transition-colors uppercase tracking-[0.1em] flex items-center gap-2"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                COPY_ALL
                              </button>
                            </div>

                            <div className="flex font-mono text-xs leading-relaxed max-h-[800px] overflow-hidden">
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
                                    <div className="absolute left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100" />
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
                    <div className="max-w-4xl mx-auto">
                      {docId && <ParsingStatus documentId={docId} autoPoll={true} />}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Registry Metadata Footer */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: 'DOCUMENT_ID', value: docId, icon: Hash },
                  { label: 'DOCUMENT_TYPE', value: documentData?.mime_type || 'application/pdf', icon: Database },
                  { label: 'SOURCE', value: documentData?.source || 'MANUAL_INGESTION', icon: Cloud },
                  { label: 'CREATED_AT', value: documentData?.created_at ? format(new Date(documentData.created_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A', icon: Calendar }
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <item.icon className="h-3.5 w-3.5 text-white/20 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <div className="font-mono text-[11px] text-white/60 group-hover:text-white transition-colors truncate">
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
