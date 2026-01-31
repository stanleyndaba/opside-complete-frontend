import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InvoiceDetail() {
  const { tenantSlug, id } = useParams();

  return (
    <PageLayout title={`Invoice ${id}`} midnight>
      <div className="relative min-h-[calc(100vh-64px)] font-serif bg-[#050505] py-12">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />

        <div className="relative container mx-auto px-6">
          <div className="mb-8">
            <Button asChild variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 -ml-4 px-4 font-mono text-[10px] uppercase tracking-widest">
              <Link to={`/app/${tenantSlug || 'default'}/billing`}>
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Return to Ledger
              </Link>
            </Button>
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl backdrop-blur-3xl overflow-hidden max-w-3xl">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.4em] mb-2">Transmission Record</p>
                  <CardTitle className="text-3xl font-serif tracking-tighter">Record {id}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-3 font-mono">SETTLED</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-sm text-white/40 italic font-serif leading-relaxed">
                "Detailed transaction artifact for record {id}. This document serves as institutional proof of capital synchronization."
              </p>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-white/30">
                  <span>Protocol Stage</span>
                  <span className="text-white">VERIFIED // FINAL</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-white/30">
                  <span>Node Cluster</span>
                  <span className="text-white">FIN_CORE_04</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="flex-1 bg-white text-black hover:bg-white/90 rounded-xl font-serif font-bold uppercase tracking-widest text-[10px] h-12 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <Download className="h-4 w-4 mr-2" /> Download PDF Artifact
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
