import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Search, Mail, Check, AlertTriangle, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
export default function EvidenceLocker() {
  const [dragActive, setDragActive] = useState(false);

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ['documents'],
    queryFn: () => apiFetch('/api/documents'),
  });
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
  return <PageLayout title="Evidence Locker & Value Engine">
      <div className="space-y-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          
          <StatsCard title="Total Documents" value={coverageData.totalDocuments} description="Successfully processed" />
          
          <StatsCard title="Processing Power" value="2.3s" description="Average extraction time" />
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Evidence Documents</CardTitle>
            <CardDescription>
              Upload invoices, purchase orders, and receipts to verify your product costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drag & Drop Your Invoices or Purchase Orders Here</h3>
              <p className="text-muted-foreground mb-4">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>or email to:</span>
                  <code className="bg-muted px-2 py-1 rounded text-foreground">
                    store@invoices.opside.ai
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document Library</CardTitle>
                <CardDescription>All uploaded evidence documents</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search documents..." className="pl-8 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked SKUs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{doc.linkedSKUs}</span>
                      {doc.linkedSKUs > 0 && <span className="text-sm text-muted-foreground ml-1">SKUs</span>}
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
    </PageLayout>;
}