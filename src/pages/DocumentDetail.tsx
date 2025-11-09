import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Check, Edit2, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { useToast } from '@/components/ui/use-toast';

export default function DocumentDetail() {
  const { id, documentId } = useParams();
  const docId = (documentId as string) || (id as string) || '';
  const [hoveredSKU, setHoveredSKU] = useState<string | null>(null);

  const [documentData, setDocumentData] = useState<any | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ field: string; message: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docId) return;
      setLoading(true);
      try {
        // Fetch both document data and parsed data
        const [docRes, parsedRes] = await Promise.all([
          api.getDocument(docId),
          api.getDocumentWithParsedData(docId).catch(() => ({ ok: false, data: null })), // Gracefully handle errors
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
            // Merge parsed metadata into document data if available
            if (parsedRes.data.parsed_metadata) {
              setDocumentData((prev: any) => ({
                ...prev,
                ...parsedRes.data!.parsed_metadata,
                parser_status: parsedRes.data!.parser_status,
                parser_confidence: parsedRes.data!.parser_confidence,
              }));
            }
          }
          
          const d = (docRes as any)?.data || {};
          const issues: Array<{ field: string; message: string }> = [];
          (d?.extractedData || []).forEach((it: any) => {
            if (!it.sku) issues.push({ field: 'sku', message: 'Missing SKU for a line item' });
            if (!it.productName) issues.push({ field: 'productName', message: 'Missing product name' });
            if (typeof it.unitCost !== 'number') issues.push({ field: 'unitCost', message: 'Missing unit cost' });
            if (typeof it.quantity !== 'number') issues.push({ field: 'quantity', message: 'Missing quantity' });
          });
          setValidationIssues(issues);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load document');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [docId]);

  const totalValue = (documentData?.extractedData || []).reduce(
    (sum, item) => sum + (item.unitCost * item.quantity), 
    0
  );

  return (
    <PageLayout title="Document Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/evidence-locker">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Evidence Locker
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {documentData?.name || 'Document'}
              </h1>
              <p className="text-muted-foreground">
                {documentData?.uploadDate ? `Uploaded on ${new Date(documentData.uploadDate).toLocaleDateString()} • ` : ''}
                {documentData?.processingTime ? `Processed in ${documentData.processingTime} • ` : ''}
                {documentData?.parsedVia ? `Parsed via ${String(documentData.parsedVia).toUpperCase()}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border-success/20">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { if (documentId) window.open(api.getDocumentDownloadUrl(documentId), '_blank'); }}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {validationIssues.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold mb-2">Validation Issues</div>
              <ul className="list-disc pl-5 text-sm text-amber-700">
                {validationIssues.map((v, i) => (
                  <li key={i}>{v.message}</li>
                ))}
              </ul>
              <div className="text-xs text-muted-foreground mt-2">
                You can ignore minor missing fields, but filling them improves matching and recovery accuracy.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{Array.isArray(documentData?.extractedData) ? documentData!.extractedData.length : 0}</div>
              <div className="text-sm text-muted-foreground">SKUs Identified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Document Value</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {documentData?.parser_confidence !== undefined 
                  ? `${(documentData.parser_confidence * 100).toFixed(0)}%` 
                  : parsedData?.parser_confidence !== undefined
                  ? `${(parsedData.parser_confidence * 100).toFixed(0)}%`
                  : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Extraction Confidence</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{documentData?.supplier || '—'}</div>
              <div className="text-sm text-muted-foreground">Supplier</div>
            </CardContent>
          </Card>
        </div>

        {/* Parsing Status */}
        {docId && (
          <Card>
            <CardHeader>
              <CardTitle>Parsing Status</CardTitle>
              <CardDescription>Document parsing and extraction status</CardDescription>
            </CardHeader>
            <CardContent>
              <ParsingStatus documentId={docId} autoPoll={true} />
            </CardContent>
          </Card>
        )}

        {/* Parsed Metadata Display */}
        {parsedData?.parsed_metadata && (
          <Card>
            <CardHeader>
              <CardTitle>Parsed Invoice Data</CardTitle>
              <CardDescription>Structured data extracted from the document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {parsedData.parsed_metadata.supplier_name && (
                  <div>
                    <div className="text-sm text-muted-foreground">Supplier</div>
                    <div className="text-lg font-semibold">{parsedData.parsed_metadata.supplier_name}</div>
                  </div>
                )}
                {parsedData.parsed_metadata.invoice_number && (
                  <div>
                    <div className="text-sm text-muted-foreground">Invoice #</div>
                    <div className="text-lg font-semibold">{parsedData.parsed_metadata.invoice_number}</div>
                  </div>
                )}
                {parsedData.parsed_metadata.invoice_date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="text-lg font-semibold">
                      {new Date(parsedData.parsed_metadata.invoice_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {parsedData.parsed_metadata.total_amount !== undefined && (
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">
                      {parsedData.parsed_metadata.currency || '$'}{parsedData.parsed_metadata.total_amount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              
              {parsedData.parsed_metadata.line_items && parsedData.parsed_metadata.line_items.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                  <div className="space-y-2">
                    {parsedData.parsed_metadata.line_items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{item.description || 'Item'}</div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {parsedData.parsed_metadata.currency || '$'}{item.unit_price?.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {parsedData.parsed_metadata.currency || '$'}{item.total?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content - Document View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                Hover over extracted data to see highlighted source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-50 rounded-lg p-4 min-h-[600px]">
                {/* Mock invoice preview */}
                <div className="bg-white shadow-sm rounded border p-6 relative">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold">SUPPLIER INVOICE</h3>
                    <p className="text-sm text-gray-600">Invoice #INV-2024-0715</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-semibold">Bill To:</h4>
                      <p className="text-sm">Your Company Name</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-b pb-1">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Unit Price</span>
                        <span>Total</span>
                      </div>
                      
                      {(documentData?.extractedData || []).map((item: any, index: number) => (
                        <div
                          key={item.sku}
                          className={`grid grid-cols-4 gap-2 text-sm py-1 transition-all ${
                            hoveredSKU === item.sku ? 'bg-yellow-200 shadow-md' : ''
                          }`}
                          style={{
                            position: 'absolute',
                            left: item.coordinates.x,
                            top: item.coordinates.y,
                            width: item.coordinates.width,
                            height: item.coordinates.height,
                          }}
                        >
                          <span className="truncate">{item.productName}</span>
                          <span>{item.quantity}</span>
                          <span>${item.unitCost}</span>
                          <span>${(item.unitCost * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Extracted Data */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
              <CardDescription>
                Supplier: <span className="font-medium">{documentData?.supplier || '—'}</span> • Invoice #: <span className="font-medium">{documentData?.invoice || '—'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(documentData?.extractedData || []).map((item: any, index: number) => (
                  <div
                    key={item.sku}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      hoveredSKU === item.sku 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onMouseEnter={() => setHoveredSKU(item.sku)}
                    onMouseLeave={() => setHoveredSKU(null)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.sku}</h4>
                        <p className="text-sm text-muted-foreground">{item.productName}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Unit Cost:</span>
                        <span className="font-semibold ml-2">${item.unitCost}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-semibold ml-2">{item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <span className="text-muted-foreground text-xs">Line Total:</span>
                      <span className="font-semibold ml-2">${(item.unitCost * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}