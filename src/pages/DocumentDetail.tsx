import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Check, Edit2, Download } from 'lucide-react';

export default function DocumentDetail() {
  const { documentId } = useParams();
  const [hoveredSKU, setHoveredSKU] = useState<string | null>(null);

  // Mock data - in real implementation, this would come from API
  const documentData = {
    id: documentId,
    name: 'July_Supplier_Invoice.pdf',
    uploadDate: '2025-01-15',
    status: 'verified',
    processingTime: '2.3s',
    extractedData: [
      {
        sku: 'SKU-ABC-001',
        productName: 'Wireless Bluetooth Headphones',
        unitCost: 15.72,
        quantity: 50,
        coordinates: { x: 320, y: 180, width: 200, height: 20 }
      },
      {
        sku: 'SKU-DEF-002', 
        productName: 'USB-C Charging Cable',
        unitCost: 3.25,
        quantity: 100,
        coordinates: { x: 320, y: 210, width: 180, height: 20 }
      },
      {
        sku: 'SKU-GHI-003',
        productName: 'Phone Case - Clear',
        unitCost: 8.50,
        quantity: 75,
        coordinates: { x: 320, y: 240, width: 160, height: 20 }
      },
      {
        sku: 'SKU-JKL-004',
        productName: 'Screen Protector Pack',
        unitCost: 12.99,
        quantity: 30,
        coordinates: { x: 320, y: 270, width: 190, height: 20 }
      }
    ]
  };

  const totalValue = documentData.extractedData.reduce(
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
                {documentData.name}
              </h1>
              <p className="text-muted-foreground">
                Uploaded on {new Date(documentData.uploadDate).toLocaleDateString()} • 
                Processed in {documentData.processingTime}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-success/10 text-success border-success/20">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{documentData.extractedData.length}</div>
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
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">Extraction Confidence</div>
            </CardContent>
          </Card>
        </div>

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
                      
                      {documentData.extractedData.map((item, index) => (
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
                AI-identified products and costs from the document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentData.extractedData.map((item, index) => (
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