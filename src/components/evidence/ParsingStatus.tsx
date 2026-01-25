import React, { useState, useEffect, useRef } from 'react';
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
      const res = await api.getDocumentWithParsedData(documentId);
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
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Intelligence Verified</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-indigo-600">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-xs font-bold">Neural Extraction Active</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Extraction Halted</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Queue Position Locked</span>
          </div>
        );
    }
  };

  if (loading && !jobStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading parsing status...</span>
      </div>
    );
  }

  if (!jobStatus) {
    return null;
  }

  return (
    <div className="space-y-0">
      {/* Status Overview - Institutional Redesign */}
      <div className="bg-gray-50/50 border-b border-gray-100 py-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-semibold text-gray-400">
            Processing Status Overview
          </h4>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-4">
            {getStatusIndicator()}
            {jobStatus.confidence_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-300">|</span>
                <span className="text-xs font-medium text-gray-500">
                  Confidence: <span className="text-gray-900 font-bold">{(jobStatus.confidence_score * 100).toFixed(1)}%</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={fetchParsingStatus}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Force Refresh
        </button>
      </div>

      <div className="bg-white p-6 space-y-8">
        {jobStatus.status === 'processing' && jobStatus.progress !== undefined && (
          <div className="space-y-3 max-w-md">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-semibold text-gray-400">Extraction Progress</span>
              <span className="text-xs font-mono text-indigo-600 font-bold">{jobStatus.progress}%</span>
            </div>
            <Progress value={jobStatus.progress} className="h-1 bg-gray-100" />
            <p className="text-xs text-gray-400 italic">Synchronizing document nodes with neural intelligence engine...</p>
          </div>
        )}

        {jobStatus.status === 'failed' && jobStatus.error && (
          <div className="flex items-start gap-3 p-4 bg-red-50/50 border border-red-100 rounded-sm">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-red-800 leading-none">Extraction Fault Detected</span>
              <p className="text-xs text-red-700 leading-relaxed font-light">{jobStatus.error}</p>
            </div>
          </div>
        )}

        {/* Parsed Metadata - Dictionary View */}
        {parsedData && jobStatus.status === 'completed' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-4 w-[2px] bg-indigo-500" />
                <h4 className="text-xs font-bold text-gray-900">Summary Intelligence</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: 'Supplier Entity', value: parsedData.supplier_name },
                  { label: 'Reference Code', value: parsedData.invoice_number, mono: true },
                  { label: 'Temporal Date', value: parsedData.invoice_date ? new Date(parsedData.invoice_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null },
                  { label: 'Validated Total', value: parsedData.total_amount !== undefined ? `${parsedData.currency || '$'}${parsedData.total_amount.toFixed(2)}` : null, highlight: true }
                ].map((item, i) => item.value && (
                  <div key={i} className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-400 block">{item.label}</span>
                    <span className={`text-sm font-medium ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'text-indigo-600 font-bold' : 'text-gray-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {parsedData.line_items && parsedData.line_items.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-4 w-[2px] bg-gray-300" />
                  <h4 className="text-xs font-bold text-gray-900">Detailed Extractions</h4>
                </div>

                <div className="border border-gray-100 rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-400">Entry Item</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-400">Qty</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-400 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-400 text-right">Total Purity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsedData.line_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium text-gray-700">{item.description}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-500 text-right">
                            {parsedData.currency || '$'}{item.unit_price?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono font-bold text-gray-900 text-right">
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

