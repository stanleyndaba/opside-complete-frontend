import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
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
  Hexagon
} from 'lucide-react';
import { api } from '@/lib/api';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

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
    if (lower.includes('gmail') || lower.includes('email')) return <Mail className="w-4 h-4" />;
    if (lower.includes('drive') || lower.includes('dropbox')) return <Cloud className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getParserStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Parsed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status || 'Unknown'}</Badge>;
    }
  };

  const extracted = documentData?.extracted || parsedData?.extracted || {};

  if (loading) {
    return (
      <PageLayout title="Document Details">
        <div className="flex items-center justify-center min-h-[400px] bg-white">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
            <div className="text-gray-600">Loading document...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Document Details">
        <div className="flex items-center justify-center min-h-[400px] bg-white">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <div className="text-red-600 mb-4">{error}</div>
            <Link to="/evidence-locker">
              <Button variant="outline" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evidence Locker
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Document Details">
      <div className="space-y-6 bg-white min-h-screen">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/evidence-locker">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="border-l border-gray-300 pl-3">
                <h1 className="text-base font-semibold text-gray-900">
                  {documentData?.name || documentData?.filename || 'Document'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                  {documentData?.source && (
                    <span className="flex items-center gap-1">
                      {getSourceIcon(documentData.source)}
                      {documentData.source}
                    </span>
                  )}
                  {documentData?.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(documentData.created_at), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {documentData?.file_size && (
                    <span>{(documentData.file_size / 1024).toFixed(1)} KB</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getParserStatusBadge(documentData?.parser_status || parsedData?.parser_status)}
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                onClick={handleTriggerParsing}
                disabled={triggeringParse}>
                {triggeringParse ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                {triggeringParse ? 'Parsing...' : 'Re-Parse'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Document Summary Dropdown */}
        <div className="mb-4 inline-block relative">
          <button
            type="button"
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <span>Document Summary</span>
            <span className="text-gray-400">
              ({(extracted.order_ids?.length || 0) + (extracted.asins?.length || 0) + (extracted.tracking_numbers?.length || 0) + (extracted.amounts?.length || 0) + matchedClaims.length} total)
            </span>
            <svg className={`w-3 h-3 text-gray-400 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {summaryOpen && (
            <div className="absolute mt-1 py-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[180px]">
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between">
                <span>Order IDs</span>
                <span className="font-medium">{extracted.order_ids?.length || 0}</span>
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between">
                <span>ASINs</span>
                <span className="font-medium">{extracted.asins?.length || 0}</span>
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between">
                <span>Tracking #s</span>
                <span className="font-medium">{extracted.tracking_numbers?.length || 0}</span>
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between">
                <span>Amounts</span>
                <span className="font-medium">{extracted.amounts?.length || 0}</span>
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between">
                <span>Matched Claims</span>
                <span className="font-medium">{matchedClaims.length}</span>
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-700 flex justify-between border-t border-gray-100 mt-1 pt-1">
                <span>Confidence</span>
                <span className="font-medium text-blue-600">
                  {documentData?.parser_confidence !== undefined
                    ? `${(documentData.parser_confidence * 100).toFixed(0)}%`
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="extracted" className="w-full">
          <TabsList className="inline-flex h-auto items-center justify-start gap-6 bg-transparent border-b border-gray-200 rounded-none p-0 mb-6">
            <TabsTrigger
              value="extracted"
              className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
              Extracted Data
            </TabsTrigger>
            <TabsTrigger
              value="matches"
              className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
              Matched Claims
              <span className="ml-1.5 text-[9px] text-gray-400">({matchedClaims.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
              Raw Text
            </TabsTrigger>
            <TabsTrigger
              value="parsing"
              className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
              Parsing Status
            </TabsTrigger>
          </TabsList>

          {/* Extracted Data Tab */}
          <TabsContent value="extracted">
            <div className="space-y-4">
              {/* Order IDs & ASINs Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Order IDs */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Order IDs</h4>
                  </div>
                  <div className="bg-white p-4">
                    {extracted.order_ids?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.order_ids.map((id: string, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200 font-mono text-[10px]">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No order IDs extracted</p>
                    )}
                  </div>
                </div>

                {/* ASINs / SKUs */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">ASINs / SKUs</h4>
                  </div>
                  <div className="bg-white p-4">
                    {(extracted.asins?.length > 0 || extracted.skus?.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.asins?.map((asin: string, idx: number) => (
                          <Badge key={`asin-${idx}`} className="bg-gray-100 text-gray-700 border-gray-200 font-mono text-[10px]">
                            {asin}
                          </Badge>
                        ))}
                        {extracted.skus?.map((sku: string, idx: number) => (
                          <Badge key={`sku-${idx}`} className="bg-gray-50 text-gray-600 border-gray-200 font-mono text-[10px]">
                            {sku}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No ASINs or SKUs extracted</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking & Amounts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tracking Numbers */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tracking Numbers</h4>
                  </div>
                  <div className="bg-white p-4">
                    {extracted.tracking_numbers?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.tracking_numbers.map((num: string, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200 font-mono text-[10px]">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No tracking numbers extracted</p>
                    )}
                  </div>
                </div>

                {/* Amounts */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Financial Amounts</h4>
                  </div>
                  <div className="bg-white p-4">
                    {extracted.amounts?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.amounts.map((amt: number | string, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200 font-mono text-[10px]">
                            ${typeof amt === 'number' ? amt.toFixed(2) : amt}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No amounts extracted</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice & Dates Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Invoice Numbers */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Invoice Numbers</h4>
                  </div>
                  <div className="bg-white p-4">
                    {extracted.invoice_numbers?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.invoice_numbers.map((inv: string, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200 font-mono text-[10px]">
                            {inv}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No invoice numbers extracted</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dates Found</h4>
                  </div>
                  <div className="bg-white p-4">
                    {extracted.dates?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {extracted.dates.map((date: string, idx: number) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No dates extracted</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Matched Claims Tab - Redesigned for Institutional Aesthetic */}
          <TabsContent value="matches" className="mt-0">
            <div className="space-y-0 border-t border-gray-100">
              {matchedClaims.length > 0 ? (
                <div>
                  {matchedClaims.map((match, idx) => (
                    <div
                      key={idx}
                      className="group relative flex items-center justify-between py-6 px-4 border-b border-gray-100 transition-all hover:bg-gray-50/50"
                    >
                      {/* Left Accent Bar on Hover */}
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <Hexagon className="w-4 h-4 text-indigo-500 fill-indigo-50/50" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
                              Claim Recovery ID
                            </span>
                            <span className="font-mono text-xs text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                              {match.claim_id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-[0.05em]">
                            <span className="text-gray-900">
                              {match.match_type?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span>
                              Matched: <span className="text-gray-700">{match.matched_fields?.join(', ')}</span>
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-indigo-600 font-bold">
                                {(match.confidence_score * 100).toFixed(0)}%
                              </span>
                              <span>Confidence</span>
                            </span>
                          </div>

                          {match.reasoning && (
                            <p className="text-xs text-gray-400 font-light leading-relaxed max-w-2xl pt-1 italic">
                              "{match.reasoning}"
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/recoveries/${match.claim_id}`}
                        className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-[0.15em] transition-colors pr-2"
                      >
                        View Recovery
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50/30">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm mb-4">
                    <Link2 className="w-5 h-5 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 uppercase tracking-wider">No Matches Found</h3>
                  <p className="text-xs text-gray-500 max-w-[240px] mx-auto leading-relaxed">
                    This document hasn't been linked to any active claims yet. Use Evidence Matching to find matches.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Raw Text Tab */}
          <TabsContent value="raw">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-[0.1em]">Raw Extracted Text</CardTitle>
                <CardDescription className="text-[10px] text-gray-500">
                  Text content extracted from the document via OCR/parsing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(documentData?.raw_text_preview || parsedData?.raw_text_preview) ? (
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 font-mono whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto border border-gray-200">
                    {documentData?.raw_text_preview || parsedData?.raw_text_preview}
                  </pre>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-2">No raw text available</p>
                    <p className="text-sm text-gray-500">
                      Document may not have been parsed yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleTriggerParsing}
                      disabled={triggeringParse}>
                      {triggeringParse ? 'Parsing...' : 'Trigger Parsing'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parsing Status Tab */}
          <TabsContent value="parsing">
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-medium text-gray-600 uppercase tracking-[0.1em]">Parsing Status</CardTitle>
                <CardDescription className="text-[10px] text-gray-500">
                  Document parsing and extraction progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {docId && <ParsingStatus documentId={docId} autoPoll={true} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Metadata Footer - Redesigned for Institutional Aesthetic */}
        <div className="pt-8 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-3 bg-indigo-500" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.15em]">Document ID</span>
              </div>
              <div className="font-mono text-[11px] text-gray-900 break-all bg-gray-50 px-2 py-1.5 rounded-sm border border-gray-100">
                {docId}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-3 bg-gray-300" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.15em]">File Type</span>
              </div>
              <div className="text-sm font-medium text-gray-900 pl-5">
                {documentData?.mime_type || documentData?.type || 'application/pdf'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-3 bg-gray-300" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.15em]">Source</span>
              </div>
              <div className="text-sm font-medium text-gray-900 pl-5 capitalize">
                {documentData?.source || 'Manual Upload'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-3 bg-gray-300" />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.15em]">Created</span>
              </div>
              <div className="text-sm font-medium text-gray-900 pl-5">
                {documentData?.created_at ? format(new Date(documentData.created_at), 'MMM dd, yyyy HH:mm') : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
