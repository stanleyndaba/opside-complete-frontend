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
  Sparkles
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
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docId) return;
      setLoading(true);
      try {
        // Fetch document data with parsed data
        const [docRes, parsedRes] = await Promise.all([
          api.getDocument(docId),
          api.getDocumentWithParsedData(docId).catch(() => ({ ok: false, data: null })),
        ]);

        if (!cancelled) {
          if (docRes.ok) {
            setDocumentData(docRes.data as any);
            setError(null);
          } else {
            setError(docRes.error || 'Failed to load document');
          }

          if (parsedRes.ok && parsedRes.data) {
            setParsedData(parsedRes.data);
            // Merge extracted data into document
            if (parsedRes.data.extracted) {
              setDocumentData((prev: any) => ({
                ...prev,
                extracted: parsedRes.data!.extracted,
                raw_text_preview: parsedRes.data!.raw_text_preview,
                parser_status: parsedRes.data!.parser_status,
                parser_confidence: parsedRes.data!.parser_confidence,
              }));
            }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/evidence-locker">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-[#36454F]">
                <FileText className="w-6 h-6" />
                {documentData?.name || documentData?.filename || 'Document'}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                {documentData?.source && (
                  <span className="flex items-center gap-1">
                    {getSourceIcon(documentData.source)}
                    {documentData.source}
                  </span>
                )}
                {documentData?.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
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
              disabled={triggeringParse}
            >
              {triggeringParse ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              {triggeringParse ? 'Parsing...' : 'Re-Parse'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              onClick={() => { if (docId) window.open(api.getDocumentDownloadUrl(docId), '_blank'); }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">Order IDs</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {extracted.order_ids?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">ASINs</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {extracted.asins?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">Tracking #s</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {extracted.tracking_numbers?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">Amounts</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {extracted.amounts?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">Matched Claims</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {matchedClaims.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-[#36454F]" />
                <span className="text-xs text-gray-600">Confidence</span>
              </div>
              <div className="text-lg font-bold text-[#36454F]">
                {documentData?.parser_confidence !== undefined
                  ? `${(documentData.parser_confidence * 100).toFixed(0)}%`
                  : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="extracted" className="w-full">
          <TabsList className="bg-gray-100 mb-4">
            <TabsTrigger value="extracted" className="data-[state=active]:bg-white">
              Extracted Data
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-white">
              Matched Claims ({matchedClaims.length})
            </TabsTrigger>
            <TabsTrigger value="raw" className="data-[state=active]:bg-white">
              Raw Text
            </TabsTrigger>
            <TabsTrigger value="parsing" className="data-[state=active]:bg-white">
              Parsing Status
            </TabsTrigger>
          </TabsList>

          {/* Extracted Data Tab */}
          <TabsContent value="extracted">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order IDs & ASINs */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#36454F]" />
                    Order IDs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracted.order_ids?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.order_ids.map((id: string, idx: number) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-200 font-mono">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No order IDs extracted</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <Hash className="w-5 h-5 text-[#36454F]" />
                    ASINs / SKUs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(extracted.asins?.length > 0 || extracted.skus?.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.asins?.map((asin: string, idx: number) => (
                        <Badge key={`asin-${idx}`} className="bg-emerald-100 text-emerald-800 border-emerald-200 font-mono">
                          {asin}
                        </Badge>
                      ))}
                      {extracted.skus?.map((sku: string, idx: number) => (
                        <Badge key={`sku-${idx}`} className="bg-teal-100 text-teal-800 border-teal-200 font-mono">
                          {sku}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No ASINs or SKUs extracted</p>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Numbers */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#36454F]" />
                    Tracking Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracted.tracking_numbers?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.tracking_numbers.map((num: string, idx: number) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-200 font-mono">
                          {num}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tracking numbers extracted</p>
                  )}
                </CardContent>
              </Card>

              {/* Amounts */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#36454F]" />
                    Financial Amounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracted.amounts?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.amounts.map((amt: number | string, idx: number) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-800 border-amber-200 font-mono">
                          ${typeof amt === 'number' ? amt.toFixed(2) : amt}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No amounts extracted</p>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Numbers */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#36454F]" />
                    Invoice Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracted.invoice_numbers?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.invoice_numbers.map((inv: string, idx: number) => (
                        <Badge key={idx} className="bg-gray-100 text-gray-800 border-gray-200 font-mono">
                          {inv}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No invoice numbers extracted</p>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-[#36454F] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#36454F]" />
                    Dates Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracted.dates?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {extracted.dates.map((date: string, idx: number) => (
                        <Badge key={idx} className="bg-indigo-100 text-indigo-800 border-indigo-200">
                          {date}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No dates extracted</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Matched Claims Tab */}
          <TabsContent value="matches">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#36454F]">Matched Claims</CardTitle>
                <CardDescription className="text-gray-600">
                  Claims that this document matches based on extracted data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchedClaims.length > 0 ? (
                  <div className="space-y-3">
                    {matchedClaims.map((match, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-[#36454F]">
                                {match.claim_id?.substring(0, 12)}...
                              </span>
                              <Badge className={
                                match.confidence_score >= 0.85 ? 'bg-emerald-100 text-emerald-800' :
                                  match.confidence_score >= 0.5 ? 'bg-amber-100 text-amber-800' :
                                    'bg-gray-100 text-gray-800'
                              }>
                                {(match.confidence_score * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {match.match_type?.replace(/_/g, ' ')} • {match.matched_fields?.join(', ')}
                            </div>
                            {match.reasoning && (
                              <p className="text-xs text-gray-500 mt-1">{match.reasoning}</p>
                            )}
                          </div>
                          <Link to={`/recoveries/${match.claim_id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-2">No matched claims yet</p>
                    <p className="text-sm text-gray-500">
                      Run Evidence Matching to find claims that match this document
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Text Tab */}
          <TabsContent value="raw">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#36454F]">Raw Extracted Text</CardTitle>
                <CardDescription className="text-gray-600">
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
                      disabled={triggeringParse}
                    >
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
              <CardHeader>
                <CardTitle className="text-[#36454F]">Parsing Status</CardTitle>
                <CardDescription className="text-gray-600">
                  Document parsing and extraction progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {docId && <ParsingStatus documentId={docId} autoPoll={true} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Document Metadata Footer */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Document ID</span>
                <div className="font-mono text-[#36454F]">{docId?.substring(0, 16)}...</div>
              </div>
              <div>
                <span className="text-gray-500">File Type</span>
                <div className="text-[#36454F]">{documentData?.mime_type || documentData?.type || 'PDF'}</div>
              </div>
              <div>
                <span className="text-gray-500">Source</span>
                <div className="text-[#36454F]">{documentData?.source || 'Manual Upload'}</div>
              </div>
              <div>
                <span className="text-gray-500">Created</span>
                <div className="text-[#36454F]">
                  {documentData?.created_at ? format(new Date(documentData.created_at), 'MMM dd, yyyy HH:mm') : '—'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}