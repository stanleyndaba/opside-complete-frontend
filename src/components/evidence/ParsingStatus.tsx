import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

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

  const getStatusBadge = () => {
    if (!jobStatus) return null;

    switch (jobStatus.status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
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
    <div className="space-y-4">
      {/* Status Overview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status Overview</h4>
        </div>
        <div className="bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {jobStatus.confidence_score !== undefined && (
                <span className="text-xs text-gray-600">
                  Confidence: {(jobStatus.confidence_score * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchParsingStatus}
              className="text-gray-600 hover:text-gray-900">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {jobStatus.status === 'processing' && jobStatus.progress !== undefined && (
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
              <Progress value={jobStatus.progress} className="h-2" />
              <div className="text-xs text-gray-600">
                Parsing document... {jobStatus.progress}%
              </div>
            </div>
          )}

          {jobStatus.status === 'failed' && jobStatus.error && (
            <div className="mt-3 pt-3 border-t border-gray-100 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {jobStatus.error}
            </div>
          )}
        </div>
      </div>

      {/* Parsed Data */}
      {parsedData && jobStatus.status === 'completed' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Parsed Metadata</h4>
          </div>
          <div className="bg-white">
            <div className="divide-y divide-gray-100">
              {parsedData.supplier_name && (
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Supplier</span>
                  <span className="text-xs font-medium text-gray-900">{parsedData.supplier_name}</span>
                </div>
              )}
              {parsedData.invoice_number && (
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Invoice #</span>
                  <span className="text-xs font-medium text-gray-900">{parsedData.invoice_number}</span>
                </div>
              )}
              {parsedData.invoice_date && (
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Date</span>
                  <span className="text-xs font-medium text-gray-900">
                    {new Date(parsedData.invoice_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {parsedData.total_amount !== undefined && (
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Total</span>
                  <span className="text-xs font-medium text-gray-900">
                    {parsedData.currency || '$'}{parsedData.total_amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {parsedData.line_items && parsedData.line_items.length> 0 && (
              <div className="border-t border-gray-200 p-4">
                <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Line Items</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {parsedData.line_items.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-700 p-2 rounded border border-gray-100 bg-gray-50">
                      {item.description} - {item.quantity} x {parsedData.currency || '$'}{item.unit_price?.toFixed(2)} = {parsedData.currency || '$'}{item.total?.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

