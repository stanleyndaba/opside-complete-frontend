import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  return (
    <PageLayout title={`Invoice ${id}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300 space-y-8">
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-xl text-gray-100">Invoice {id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">This is a placeholder invoice view for sandbox routing.</p>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><Link to="/billing"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Billing</Link></Button>
                  <Button><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
