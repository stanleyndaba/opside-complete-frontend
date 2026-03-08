import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Activity, Package } from 'lucide-react';

interface ParsingStatusProps {
  documentId: string;
  autoPoll?: boolean;
  onStatusChange?: (status: string) => void;
}

export function ParsingStatus({ documentId, autoPoll = true, onStatusChange }: ParsingStatusProps) {
  const [jobStatus, setJobStatus] = useState<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    confidence_score?: number;
    error?: string;
  } | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const activeSlug = tenantSlug || 'beta';

  useEffect(() => {
    if (documentId) {
      fetchParsingStatus();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [documentId]);

  const fetchParsingStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getDocumentWithParsedData(documentId, activeSlug);
      if (res.ok && res.data) {
        const data = res.data;
        const status = data.parser_status || data.processing_status || 'pending';

        setJobStatus({
          status: status as any,
          progress: data.parser_status === 'processing' ? 50 : data.parser_status === 'completed' ? 100 : 0,
          confidence_score: data.parser_confidence,
        });

        if (data.parsed_metadata) {
          setParsedData(data.parsed_metadata);
        }

        onStatusChange?.(status);

        // Stop polling if completed or failed
        if (status === 'completed' || status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (autoPoll && status === 'processing') {
          // Start polling for processing status
          startPolling();
        }
      } else {
        setJobStatus({ status: 'pending', progress: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch parsing status:', error);
      setJobStatus({ status: 'failed', progress: 0, error: 'Failed to fetch status' });
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchParsingStatus();
    }, 5000);

    // Stop polling after 10 minutes
    timeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 10 * 60 * 1000);
  };

  const getStatusIndicator = () => {
    if (!jobStatus) return null;

    switch (jobStatus.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">INTELLIGENCE_VERIFIED</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-amber-500">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">EXTRACTION_ACTIVE</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-rose-500">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">EXTRACTION_HALTED</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 text-white/20">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">QUEUE_LOCKED</span>
          </div>
        );
    }
  };

  if (loading && !jobStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-emerald-500/30" />
          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">SYNCHRONIZING_STATUS...</span>
        </div>
      </div>
    );
  }

  if (!jobStatus) {
    return null;
  }

  return (
    <div className="space-y-0 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Status Overview */}
      <div className="bg-white/[0.03] border-b border-white/10 py-5 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h4 className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">
            NODE_OVERVIEW
          </h4>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-6">
            {getStatusIndicator()}
            {jobStatus.confidence_score !== undefined && (
              <div className="flex items-center gap-4">
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                  CONFIDENCE: <span className="text-emerald-500 font-bold">{(jobStatus.confidence_score * 100).toFixed(1)}%</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={fetchParsingStatus}
          disabled={loading}
          className="flex items-center gap-2 text-[10px] font-sans font-bold text-white/30 hover:text-emerald-500 transition-all uppercase tracking-tight group"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          FORCE_REFRESH
        </button>
      </div>

      <div className="bg-[#0a0a0a] p-8 space-y-10">
        {jobStatus.status === 'processing' && jobStatus.progress !== undefined && (
          <div className="space-y-4 max-w-xl">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">EXTRACTION_PROGRESS</span>
              <span className="text-sm font-sans font-bold text-amber-500">{jobStatus.progress}%</span>
            </div>
            <Progress value={jobStatus.progress} className="h-1.5 bg-white/5" />
            <p className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight leading-relaxed">
              Synchronizing document nodes with neural intelligence engine...
            </p>
          </div>
        )}

        {jobStatus.status === 'failed' && jobStatus.error && (
          <div className="flex items-start gap-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-rose-500/50 mt-0.5" />
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-rose-500 uppercase tracking-tight leading-none block">EXTRACTION_FAULT_DETECTED</span>
              <p className="text-xs text-rose-500/40 leading-relaxed font-sans font-bold tracking-tight">{jobStatus.error}</p>
            </div>
          </div>
        )}

        {/* Parsed Metadata - Dictionary View */}
        {parsedData && jobStatus.status === 'completed' && (
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <h4 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">SUMMARY_INTELLIGENCE</h4>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                  { label: 'Supplier Entity', value: parsedData.supplier_name },
                  { label: 'Reference Code', value: parsedData.invoice_number, mono: true },
                  { label: 'Temporal Date', value: parsedData.invoice_date ? new Date(parsedData.invoice_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null },
                  { label: 'Validated Total', value: parsedData.total_amount !== undefined ? `${parsedData.currency || '$'}${parsedData.total_amount.toFixed(2)}` : null, highlight: true }
                ].map((item, i) => item.value && (
                  <div key={i} className="space-y-2">
                    <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight block">{item.label}</span>
                    <span className={`text-sm tracking-tight font-sans font-bold ${item.highlight ? 'text-emerald-500' : 'text-white/80'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {parsedData.line_items && parsedData.line_items.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <h4 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">DETAILED_EXTRACTIONS</h4>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">ENTRY_ITEM</th>
                        <th className="px-6 py-4 text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">QTY</th>
                        <th className="px-6 py-4 text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight text-right">UNIT_PRICE</th>
                        <th className="px-6 py-4 text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight text-right">PURITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedData.line_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4 text-xs font-bold text-white/70 tracking-tight">{item.description}</td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white/40 tracking-tight">{item.quantity}</td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white/40 text-right tracking-tight">
                            {parsedData.currency || '$'}{item.unit_price?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white group-hover:text-emerald-500 transition-colors text-right tracking-tight">
                            {parsedData.currency || '$'}{item.total?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

