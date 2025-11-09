import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Search, Mail, Check, AlertTriangle, Clock, Eye, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { ParsingStatus } from '@/components/evidence/ParsingStatus';
import { GmailConnectionStatus } from '@/components/evidence/GmailConnectionStatus';
import { EvidenceIngestion } from '@/components/evidence/EvidenceIngestion';
export default function EvidenceLocker() {
  const [dragActive, setDragActive] = useState(false);

  const [documents, setDocuments] = useState<Array<{ id: string; name: string; uploadDate: string; status: string; linkedSKUs?: number; supplier?: string; invoice?: string; amount?: number; parsedVia?: 'regex' | 'ocr' | 'ml'; matchedClaims?: string[]; type?: string; parser_status?: string; parser_confidence?: number; parsed_metadata?: any }>>([]);
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
          // Enhance documents with parsed data
          const enhancedDocs = await Promise.all(
            docRes.data.map(async (doc: any) => {
              // Try to get parsed data for each document
              try {
                const parsedRes = await api.getDocumentWithParsedData(doc.id);
                if (parsedRes.ok && parsedRes.data) {
                  return {
                    ...doc,
                    parser_status: parsedRes.data.parser_status,
                    parser_confidence: parsedRes.data.parser_confidence,
                    parsed_metadata: parsedRes.data.parsed_metadata,
                  };
                }
              } catch (e) {
                // Ignore errors for individual documents
              }
              return doc;
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
            toast({ title: 'Ingestion complete', description: 'New documents are available.' });
            // Refresh documents
            api.getDocuments().then(res => {
              if (res.ok && Array.isArray(res.data)) {
                setDocuments(res.data);
              }
            });
          }
          if (evt?.type === 'parsing' && evt?.status === 'completed') {
            // Refresh document with parsed data
            if (evt?.document_id) {
              api.getDocumentWithParsedData(evt.document_id).then(res => {
                if (res.ok && res.data) {
                  setDocuments(prev => prev.map(doc => 
                    doc.id === evt.document_id 
                      ? { ...doc, parser_status: res.data!.parser_status, parser_confidence: res.data!.parser_confidence, parsed_metadata: res.data!.parsed_metadata }
                      : doc
                  ));
                }
              });
            }
          }
        } catch {}
      };
    } catch {}
    
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
      return;
    }
    
    // Show immediate feedback
    toast({ 
      title: 'Uploading...', 
      description: `Uploading ${files.length} document(s)...` 
    });
    
    try {
      setLoading(true);
      const form = new FormData();
      // API expects 'file' for single file, 'files' for multiple
      if (files.length === 1) {
        form.append('file', files[0]);
      } else {
        for (const f of files) {
          form.append('files', f);
        }
      }
      
      const uploadUrl = api.buildApiUrl('/api/documents/upload');
      console.log('[Upload] Uploading to:', uploadUrl);
      console.log('[Upload] Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const res = await fetch(uploadUrl, { 
        method: 'POST', 
        credentials: 'include',
        headers: {
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: form
      });
      
      console.log('[Upload] Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Upload] Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Upload failed with status ${res.status}` };
        }
        throw new Error(errorData.message || errorData.error || `Upload failed: ${res.status} ${res.statusText}`);
      }
      
      const responseData = await res.json().catch(() => null);
      console.log('[Upload] Success response:', responseData);
      
      // Show success toast
      toast({ 
        title: '✅ Uploaded Successfully', 
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
          toast({ 
            title: '📄 Documents Added', 
            description: `${newCount} new document(s) are now in your Evidence Locker.`,
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
      toast({ 
        title: 'Upload Failed', 
        description: err?.message || 'Failed to upload documents. Please try again.', 
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return documents.filter(d => {
      const matchQ = !term || (d.name || '').toLowerCase().includes(term) || (d.supplier || '').toLowerCase().includes(term) || (d.invoice || '').toLowerCase().includes(term) || (d.matchedClaims || []).some(c => c.toLowerCase().includes(term));
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
      linkedSKUs: d.linkedSKUs ?? '',
    }));
    const header = Object.keys(rows[0] || { id: '', name: '' }).join(',');
    const lines = rows.map(r => Object.values(r).map(v => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : v).join(','));
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'evidence-documents.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDoc = async (id: string) => {
    const url = api.getDocumentDownloadUrl(id);
    window.open(url, '_blank');
  };

  return <PageLayout title="Evidence Locker & Value Engine">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300">
        {evidenceStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Documents"
              value={evidenceStatus.documentsCount}
              description="All evidence documents"
            />
            <StatsCard
              title="Processing"
              value={evidenceStatus.processingCount}
              description="Documents being parsed"
            />
            <StatsCard
              title="Completed"
              value={evidenceStatus.documentsCount - evidenceStatus.processingCount}
              description="Documents ready"
            />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GmailConnectionStatus onStatusChange={setGmailConnected} />
          <EvidenceIngestion gmailConnected={gmailConnected} onIngestionComplete={() => {
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
          }} />
        </div>
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardHeader>
            <CardTitle>Upload Evidence Documents</CardTitle>
            <CardDescription>
              Upload invoices, purchase orders, and receipts to verify your product costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-emerald-500/50 bg-white/5' : 'border-white/20 hover:border-emerald-400/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Drag & Drop Your Invoices or Purchase Orders Here</h3>
              <p className="text-gray-400 mb-4">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold" onClick={() => document.getElementById('doc-file-input')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                <input id="doc-file-input" type="file" multiple className="hidden" onChange={async (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  if (!files.length) {
                    toast({ 
                      title: 'No files', 
                      description: 'Please select valid files to upload.', 
                      variant: 'destructive' 
                    });
                    return;
                  }
                  
                  // Show immediate feedback
                  toast({ 
                    title: 'Uploading...', 
                    description: `Uploading ${files.length} document(s)...` 
                  });
                  
                  try {
                    setLoading(true);
                    const form = new FormData();
                    // API expects 'file' for single file, 'files' for multiple
                    if (files.length === 1) {
                      form.append('file', files[0]);
                    } else {
                      for (const f of files) {
                        form.append('files', f);
                      }
                    }
                    
                    const uploadUrl = api.buildApiUrl('/api/documents/upload');
                    console.log('[Upload] Uploading to:', uploadUrl);
                    console.log('[Upload] Files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
                    
                    const res = await fetch(uploadUrl, { 
                      method: 'POST', 
                      credentials: 'include',
                      headers: {
                        // Don't set Content-Type header - browser will set it with boundary for FormData
                      },
                      body: form
                    });
                    
                    console.log('[Upload] Response status:', res.status, res.statusText);
                    
                    if (!res.ok) {
                      const errorText = await res.text();
                      console.error('[Upload] Error response:', errorText);
                      let errorData;
                      try {
                        errorData = JSON.parse(errorText);
                      } catch {
                        errorData = { message: errorText || `Upload failed with status ${res.status}` };
                      }
                      throw new Error(errorData.message || errorData.error || `Upload failed: ${res.status} ${res.statusText}`);
                    }
                    
                    const responseData = await res.json().catch(() => null);
                    console.log('[Upload] Success response:', responseData);
                    
                    // Show success toast
                    toast({ 
                      title: '✅ Uploaded Successfully', 
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
                        toast({ 
                          title: '📄 Documents Added', 
                          description: `${newCount} new document(s) are now in your Evidence Locker.`,
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
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>or email to:</span>
                  <code className="bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-100">
                    store@invoices.opside.ai
                  </code>
                  <Link to="/integrations-hub" className="ml-3 inline-flex items-center gap-1 text-blue-300 hover:text-blue-200">
                    Connect Sources <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={exportCsv}>Export CSV</Button>
                <div className="text-xs text-gray-400 ml-2">{selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-200">Document Library</CardTitle>
                <CardDescription className="text-gray-400">All uploaded evidence documents</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search supplier, invoice #, claim ID…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-72 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                </div>
                <Input placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-40 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Input placeholder="Type (invoice/receipt/shipping)" value={type} onChange={(e) => setType(e.target.value)} className="w-56 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Input placeholder="Amount min" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="w-28 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Input placeholder="Amount max" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="w-28 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500 [color-scheme:dark]" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500 [color-scheme:dark]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading && <div className="text-sm text-muted-foreground">Loading documents…</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="overflow-x-auto">
              <Table className="min-w-[1150px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300 whitespace-nowrap">
                      <Checkbox checked={selectedIds.size>0 && selectedIds.size===pageData.length} onCheckedChange={(c) => {
                        if (c) setSelectedIds(new Set(pageData.map(d=>d.id))); else setSelectedIds(new Set());
                      }} />
                    </TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('name')}>Document Name</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('supplier')}>Supplier</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('invoice')}>Invoice #</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('uploadDate')}>Upload Date</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('status')}>Status</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('parser_status')}>Parsing Status</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('parsedVia')}>Parsed Via</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('amount')}>Amount</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('matchedClaims')}>Matched Claims</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap cursor-pointer" onClick={() => toggleSort('linkedSKUs')}>Linked SKUs</TableHead>
                    <TableHead className="text-gray-300 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map(doc => <TableRow key={doc.id}>
                      <TableCell className="whitespace-nowrap">
                        <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={(c) => {
                          setSelectedIds(prev => { const next=new Set(prev); if (c) next.add(doc.id); else next.delete(doc.id); return next; });
                        }} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-100">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{doc.supplier || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{doc.invoice || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {doc.parser_status && (
                          <div className="flex items-center gap-2">
                            {doc.parser_status === 'completed' && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Parsed
                              </Badge>
                            )}
                            {doc.parser_status === 'processing' && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Parsing
                              </Badge>
                            )}
                            {doc.parser_status === 'failed' && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {doc.parser_status === 'pending' && (
                              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                Pending
                              </Badge>
                            )}
                            {doc.parser_confidence !== undefined && (
                              <span className="text-xs text-gray-400">
                                {(doc.parser_confidence * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {doc.parsedVia && <Badge variant="outline" className="text-xs capitalize border-white/20 text-gray-200">{doc.parsedVia}</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{typeof doc.amount === 'number' ? `$${doc.amount.toFixed(2)}` : '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(doc.matchedClaims || []).map(id => (
                            <Link key={id} to={`/recoveries/${id}`} className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10">
                              {id}
                            </Link>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium text-gray-100">{doc.linkedSKUs}</span>
                        {doc.linkedSKUs > 0 && <span className="text-sm text-gray-400 ml-1">SKUs</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/documents/${encodeURIComponent(doc.id)}`}>
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => downloadDoc(doc.id)}>
                            <Download className="w-4 h-4 mr-1" />
                          </Button>
                          {doc.parser_status && doc.parser_status !== 'completed' && doc.parser_status !== 'processing' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={async () => {
                                try {
                                  const res = await api.triggerDocumentParse(doc.id);
                                  if (res.ok) {
                                    toast({ title: 'Parsing Started', description: 'Document parsing has been triggered.' });
                                    // Refresh document status
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
                            >
                              Parse
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            {pageData.length === 0 && !loading && (
              <div className="text-center text-sm text-gray-400 py-6">No documents found. Try adjusting filters or <Link to="/integrations-hub" className="underline">connect evidence sources</Link>.</div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-400">Page {page} of {totalPages} • {sorted.length} items</div>
              <div className="flex items-center gap-3">
                <select className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </PageLayout>;
}
