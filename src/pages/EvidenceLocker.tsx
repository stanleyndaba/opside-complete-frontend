import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Search, Mail, Check, AlertTriangle, Clock, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
export default function EvidenceLocker() {
  const [dragActive, setDragActive] = useState(false);

  const [documents, setDocuments] = useState<Array<{ id: string; name: string; uploadDate: string; status: string; linkedSKUs?: number; supplier?: string; invoice?: string; amount?: number; parsedVia?: 'regex' | 'ocr' | 'ml'; matchedClaims?: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await api.getDocuments();
      if (!cancelled) {
        if (res.ok && Array.isArray(res.data)) {
          setDocuments(res.data);
          setError(null);
        } else {
          setError(res.error || 'Failed to load documents');
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true };
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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload logic here
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter(d =>
      (d.name || '').toLowerCase().includes(term) ||
      (d.supplier || '').toLowerCase().includes(term) ||
      (d.invoice || '').toLowerCase().includes(term) ||
      (d.matchedClaims || []).some(c => c.toLowerCase().includes(term))
    );
  }, [q, documents]);

  return <PageLayout title="Evidence Locker & Value Engine">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300 space-y-8">
        

        {/* Upload Section */}
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
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>or email to:</span>
                  <code className="bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-100">
                    store@invoices.opside.ai
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-200">Document Library</CardTitle>
                <CardDescription className="text-gray-400">All uploaded evidence documents</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search supplier, invoice #, claim ID…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 w-72 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-muted-foreground">Loading documents…</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Document Name</TableHead>
                  <TableHead className="text-gray-300">Supplier</TableHead>
                  <TableHead className="text-gray-300">Invoice #</TableHead>
                  <TableHead className="text-gray-300">Upload Date</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Parsed Via</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Matched Claims</TableHead>
                  <TableHead className="text-gray-300">Linked SKUs</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(doc => <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-100">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.supplier || '—'}</TableCell>
                    <TableCell>{doc.invoice || '—'}</TableCell>
                    <TableCell>
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell>
                      {doc.parsedVia && <Badge variant="outline" className="text-xs capitalize">{doc.parsedVia}</Badge>}
                    </TableCell>
                    <TableCell>{typeof doc.amount === 'number' ? `$${doc.amount.toFixed(2)}` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(doc.matchedClaims || []).map(id => (
                          <Link key={id} to={`/recoveries/${id}`} className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10">
                            {id}
                          </Link>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-100">{doc.linkedSKUs}</span>
                      {doc.linkedSKUs > 0 && <span className="text-sm text-gray-400 ml-1">SKUs</span>}
                    </TableCell>
                    <TableCell>
                    {doc.status === 'verified' ? <Link to={`/evidence-locker/document/${doc.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link> : <Button variant="ghost" size="sm" disabled>
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </PageLayout>;
}
