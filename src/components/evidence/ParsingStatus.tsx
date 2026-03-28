import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { getParsingTruth, formatAutonomyLabel, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

interface ParsingStatusProps {
  documentId: string;
  autoPoll?: boolean;
  onStatusChange?: (status: string) => void;
  documentData?: any;
  onRefresh?: () => Promise<void> | void;
}

type ParsingViewState = ReturnType<typeof getParsingTruth> & {
  progress: number;
};

function toParsingViewState(record: any): ParsingViewState {
  const truth = getParsingTruth(record);
  return {
    ...truth,
    progress: truth.status === 'processing' ? 50 : truth.status === 'completed' || truth.status === 'partial' ? 100 : 0
  };
}

function getExplanationLines(explanation: ParsingViewState['explanation']) {
  if (!explanation) return [];
  const lines: Array<{ label: string; value: string }> = [];
  if (explanation.reason) lines.push({ label: 'Reason', value: explanation.reason });
  if (explanation.completed_steps?.length) lines.push({ label: 'Completed', value: explanation.completed_steps.join(', ') });
  if (explanation.failed_steps?.length) lines.push({ label: 'Failed', value: explanation.failed_steps.join(', ') });
  if (explanation.preserved_outputs?.length) lines.push({ label: 'Preserved', value: explanation.preserved_outputs.join(', ') });
  return lines;
}

export function ParsingStatus({ documentId, autoPoll = true, onStatusChange, documentData, onRefresh }: ParsingStatusProps) {
  const [jobStatus, setJobStatus] = useState<ParsingViewState | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const activeSlug = tenantSlug || 'beta';
  const usingExternalData = !!documentData;

  useEffect(() => {
    if (usingExternalData) {
      return () => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (documentId) {
      void fetchParsingStatus();
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [documentId, usingExternalData]);

  const fetchParsingStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getDocumentWithParsedData(documentId, activeSlug);
      if (res.ok && res.data) {
        const data = res.data;
        const nextState = toParsingViewState(data);
        setJobStatus(nextState);

        if (data.parsed_metadata) {
          setParsedData(data.parsed_metadata);
        }

        onStatusChange?.(nextState.status);

        if (nextState.isTerminal) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (autoPoll) {
          startPolling();
        }
      } else {
        setJobStatus({ ...toParsingViewState({ parser_status: 'pending' }), error: res.error || null });
      }
    } catch (error) {
      console.error('Failed to fetch parsing status:', error);
      setJobStatus({
        ...toParsingViewState({
          parser_status: 'failed',
          parsing_strategy: 'FAILED_DURABLE',
          parsing_explanation: {
            reason: 'Failed to fetch parser state from the backend.',
            completed_steps: [],
            failed_steps: ['status_lookup'],
            preserved_outputs: []
          }
        }),
        error: 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (usingExternalData) return;
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(() => {
      void fetchParsingStatus();
    }, 5000);

    timeoutRef.current = setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 10 * 60 * 1000);
  };

  const effectiveStatus = usingExternalData ? toParsingViewState(documentData) : jobStatus;
  const effectiveParsedData = usingExternalData ? documentData?.parsed_metadata : parsedData;
  const explanationLines = getExplanationLines(effectiveStatus?.explanation);
  const runtimeSummary = summarizeOperationalExplanation(effectiveStatus?.operationalExplanation);

  const getStatusIndicator = () => {
    if (!effectiveStatus) return null;

    switch (effectiveStatus.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-white/80">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">FULL_PARSE_COMPLETE</span>
          </div>
        );
      case 'partial':
        return (
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">PARTIAL_PARSE_READY</span>
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
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">FAILED_DURABLE</span>
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

  if (loading && !effectiveStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-white/30" />
          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">SYNCHRONIZING_STATUS...</span>
        </div>
      </div>
    );
  }

  if (!effectiveStatus) {
    return null;
  }

  return (
    <div className="space-y-0 rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="bg-white/[0.03] border-b border-white/10 py-5 px-6 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h4 className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">NODE_OVERVIEW</h4>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-6">
            {getStatusIndicator()}
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
              {effectiveStatus.strategy ? formatAutonomyLabel(effectiveStatus.strategy) : formatAutonomyLabel(effectiveStatus.status)}
            </Badge>
            {effectiveStatus.confidence != null && (
              <div className="flex items-center gap-4">
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                  CONFIDENCE: <span className="text-white font-bold">{(effectiveStatus.confidence * 100).toFixed(1)}%</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            if (usingExternalData) {
              void onRefresh?.();
              return;
            }
            void fetchParsingStatus();
          }}
          disabled={loading}
          className="flex items-center gap-2 text-[10px] font-sans font-bold text-white/30 hover:text-blue-400 transition-all uppercase tracking-tight group"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          FORCE_REFRESH
        </button>
      </div>

      <div className="bg-[#0a0a0a] p-8 space-y-10">
        {effectiveStatus.status === 'processing' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">EXTRACTION_PROGRESS</span>
              <span className="text-sm font-sans font-bold text-amber-500">{effectiveStatus.progress}%</span>
            </div>
            <Progress value={effectiveStatus.progress} className="h-1.5 bg-white/5" />
            <p className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight leading-relaxed">
              Synchronizing document nodes with neural intelligence engine...
            </p>
          </div>
        )}

        {effectiveStatus.status === 'failed' && effectiveStatus.error && (
          <div className="flex items-start gap-4 p-5 bg-rose-500/5 border border-rose-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-rose-500/50 mt-0.5" />
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-rose-500 uppercase tracking-tight leading-none block">EXTRACTION_FAULT_DETECTED</span>
              <p className="text-xs text-rose-500/40 leading-relaxed font-sans font-bold tracking-tight">{effectiveStatus.error}</p>
            </div>
          </div>
        )}

        {explanationLines.length > 0 && effectiveStatus.status !== 'processing' && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Parse Decision</span>
              <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[9px] font-sans font-bold uppercase tracking-tight text-white/60">
                {effectiveStatus.strategy ? formatAutonomyLabel(effectiveStatus.strategy) : formatAutonomyLabel(effectiveStatus.status)}
              </Badge>
              {effectiveStatus.operationalState ? (
                <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[9px] font-sans font-bold uppercase tracking-tight text-amber-100/80">
                  Runtime {formatAutonomyLabel(effectiveStatus.operationalState)}
                </Badge>
              ) : null}
            </div>
            <div className="space-y-2">
              {explanationLines.map((line) => (
                <div key={line.label} className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{line.label}</span>
                  <span className="text-right text-[11px] font-sans font-semibold tracking-tight text-white/76">{line.value}</span>
                </div>
              ))}
              {runtimeSummary ? (
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">Runtime</span>
                  <span className="text-right text-[11px] font-sans font-semibold tracking-tight text-amber-100/70">{runtimeSummary}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {effectiveParsedData && (effectiveStatus.status === 'completed' || effectiveStatus.status === 'partial') && (
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                <h4 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                  {effectiveStatus.status === 'partial' ? 'PARTIAL_INTELLIGENCE' : 'SUMMARY_INTELLIGENCE'}
                </h4>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                  { label: 'Supplier Entity', value: effectiveParsedData.supplier_name },
                  { label: 'Reference Code', value: effectiveParsedData.invoice_number, mono: true },
                  { label: 'Temporal Date', value: effectiveParsedData.invoice_date ? new Date(effectiveParsedData.invoice_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null },
                  { label: 'Validated Total', value: effectiveParsedData.total_amount !== undefined ? `${effectiveParsedData.currency || '$'}${effectiveParsedData.total_amount.toFixed(2)}` : null, highlight: true }
                ].map((item, i) => item.value && (
                  <div key={i} className="space-y-2">
                    <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight block">{item.label}</span>
                    <span className={`text-sm tracking-tight font-sans font-bold ${item.highlight ? 'text-white' : 'text-white/80'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {effectiveParsedData.line_items && effectiveParsedData.line_items.length > 0 && (
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
                      {effectiveParsedData.line_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4 text-xs font-bold text-white/70 tracking-tight">{item.description}</td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white/40 tracking-tight">{item.quantity}</td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white/40 text-right tracking-tight">
                            {effectiveParsedData.currency || '$'}{item.unit_price?.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-xs font-sans font-bold text-white group-hover:text-blue-400 transition-colors text-right tracking-tight">
                            {effectiveParsedData.currency || '$'}{item.total?.toFixed(2)}
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
