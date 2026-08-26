import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { getParsingTruth, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
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
  if (explanation.reason) lines.push({ label: 'Recorded reason', value: explanation.reason });
  if (explanation.completed_steps?.length) lines.push({ label: 'Details recorded', value: explanation.completed_steps.join(', ') });
  if (explanation.failed_steps?.length) lines.push({ label: 'Details unavailable', value: explanation.failed_steps.join(', ') });
  if (explanation.preserved_outputs?.length) lines.push({ label: 'Available details', value: explanation.preserved_outputs.join(', ') });
  return lines;
}

function getProcessingMethodLabel(strategy: ParsingViewState['strategy']) {
  if (strategy === 'FULL') return 'Full artifact review recorded';
  if (strategy === 'PARTIAL') return 'Partial artifact review recorded';
  if (strategy === 'FAILED_DURABLE') return 'Artifact review could not be completed';
  return 'Processing method not recorded';
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
      console.error('Failed to fetch artifact processing status:', error);
      setJobStatus({
        ...toParsingViewState({
          parser_status: 'failed',
          parsing_strategy: 'FAILED_DURABLE',
          parsing_explanation: {
            reason: 'Margin could not retrieve the current artifact-processing status.',
            completed_steps: [],
            failed_steps: ['status lookup'],
            preserved_outputs: []
          }
        }),
        error: 'Margin could not retrieve the current artifact-processing status.'
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
  const processingUpdate = summarizeOperationalExplanation(effectiveStatus?.operationalExplanation);

  const getStatusIndicator = () => {
    if (!effectiveStatus) return null;

    switch (effectiveStatus.status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-[#237749]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Artifact details available</span>
          </div>
        );
      case 'partial':
        return (
          <div className="flex items-center gap-2 text-[#A5670A]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Some artifact details available</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-[#A5670A]">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            <span className="text-[11px] font-semibold">Reviewing artifact</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-[#B42318]">
            <XCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Artifact details unavailable</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 text-[#66737F]">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold">Awaiting artifact review</span>
          </div>
        );
    }
  };

  if (loading && !effectiveStatus) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#E7EEF2] bg-white p-12">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-6 w-6 animate-spin text-[#8A99A5]" />
          <span className="text-[11px] font-medium text-[#66737F]">Loading artifact processing status</span>
        </div>
      </div>
    );
  }

  if (!effectiveStatus) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#E7EEF2] bg-white shadow-sm" aria-label="Artifact processing details">
      <header className="flex flex-col gap-3 border-b border-[#E7EEF2] bg-[#F8FAFB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h4 className="text-[12px] font-semibold text-[#182026]">Artifact processing</h4>
          <div className="hidden h-4 w-px bg-[#D7E1E8] sm:block" />
          {getStatusIndicator()}
          <Badge variant="outline" className="border-[#D7E1E8] bg-white text-[10px] font-medium text-[#4D5B66]">
            {getProcessingMethodLabel(effectiveStatus.strategy)}
          </Badge>
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
          className="inline-flex items-center gap-2 text-[11px] font-medium text-[#4D5B66] transition-colors hover:text-[#0B74DE] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh status
        </button>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        {effectiveStatus.status === 'processing' && (
          <div className="max-w-xl space-y-3 rounded-lg border border-[#F0D8A8] bg-[#FFF9EE] p-4">
            <div className="flex items-end justify-between">
              <span className="text-[11px] font-medium text-[#80530B]">Artifact review progress</span>
              <span className="text-sm font-semibold text-[#A5670A]">{effectiveStatus.progress}%</span>
            </div>
            <Progress value={effectiveStatus.progress} className="h-1.5 bg-[#F7E9CB]" />
            <p className="text-[12px] leading-5 text-[#80530B]">
              Margin is recording available details from this artifact. You can continue to inspect the artifact while this review is in progress.
            </p>
          </div>
        )}

        {effectiveStatus.status === 'failed' && (
          <div className="flex items-start gap-3 rounded-lg border border-[#F4C7C3] bg-[#FFF6F5] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B42318]" />
            <div className="space-y-1">
              <p className="text-[12px] font-semibold text-[#8C1D18]">Artifact details could not be recorded yet</p>
              <p className="text-[12px] leading-5 text-[#9B3A33]">
                The original artifact and its recorded provenance remain available. Refresh the status later or review the available artifact details.
              </p>
            </div>
          </div>
        )}

        {explanationLines.length > 0 && effectiveStatus.status !== 'processing' && (
          <div className="rounded-lg border border-[#E7EEF2] bg-[#FCFDFD] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#4D5B66]">Recorded processing details</span>
              {effectiveStatus.operationalState ? (
                <Badge variant="outline" className="border-[#D7E1E8] bg-white text-[10px] font-medium text-[#66737F]">
                  Current state recorded
                </Badge>
              ) : null}
            </div>
            <div className="space-y-2.5">
              {explanationLines.map((line) => (
                <div key={line.label} className="flex flex-col gap-1 border-b border-[#EDF2F5] pb-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                  <span className="text-[11px] font-medium text-[#66737F]">{line.label}</span>
                  <span className="text-[12px] font-medium text-[#182026] sm:max-w-[65%] sm:text-right">{line.value}</span>
                </div>
              ))}
              {processingUpdate ? (
                <div className="flex flex-col gap-1 border-b border-[#EDF2F5] pb-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                  <span className="text-[11px] font-medium text-[#66737F]">Processing update</span>
                  <span className="text-[12px] font-medium text-[#4D5B66] sm:max-w-[65%] sm:text-right">{processingUpdate}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {effectiveStatus.confidence != null && (
          <p className="rounded-lg border border-[#E7EEF2] bg-[#F8FAFB] px-4 py-3 text-[12px] leading-5 text-[#4D5B66]">
            <span className="font-semibold text-[#182026]">Recorded detail confidence: {(effectiveStatus.confidence * 100).toFixed(1)}%.</span>{' '}
            This describes the system&apos;s confidence in recorded artifact details only. It does not establish proof, relationship strength, reimbursement eligibility, payment, a financial conclusion, or closure.
          </p>
        )}

        {effectiveParsedData && (effectiveStatus.status === 'completed' || effectiveStatus.status === 'partial') && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h4 className="text-[12px] font-semibold text-[#182026]">
                  {effectiveStatus.status === 'partial' ? 'Available artifact details' : 'Recorded artifact details'}
                </h4>
                <div className="h-px flex-1 bg-[#E7EEF2]" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Supplier', value: effectiveParsedData.supplier_name },
                  { label: 'Reference number', value: effectiveParsedData.invoice_number, mono: true },
                  { label: 'Document date', value: effectiveParsedData.invoice_date ? new Date(effectiveParsedData.invoice_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null },
                  { label: 'Recorded total', value: effectiveParsedData.total_amount !== undefined ? `${effectiveParsedData.currency || '$'}${effectiveParsedData.total_amount.toFixed(2)}` : null, highlight: true }
                ].map((item, i) => item.value && (
                  <div key={i} className="rounded-lg border border-[#E7EEF2] bg-[#FCFDFD] p-3">
                    <span className="block text-[10px] font-medium uppercase tracking-wide text-[#8A99A5]">{item.label}</span>
                    <span className={`mt-1 block text-[13px] font-semibold ${item.highlight ? 'text-[#182026]' : 'text-[#4D5B66]'} ${item.mono ? 'font-mono text-[12px]' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {effectiveParsedData.line_items && effectiveParsedData.line_items.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-[12px] font-semibold text-[#182026]">Recorded line items</h4>
                  <div className="h-px flex-1 bg-[#E7EEF2]" />
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E7EEF2]">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#E7EEF2] bg-[#F8FAFB]">
                        <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Item</th>
                        <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Quantity</th>
                        <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Unit amount</th>
                        <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Line amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F5]">
                      {effectiveParsedData.line_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#FAFCFD]">
                          <td className="px-4 py-3 text-[12px] font-medium text-[#182026]">{item.description}</td>
                          <td className="px-4 py-3 text-[12px] text-[#4D5B66]">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-[12px] text-[#4D5B66]">
                            {effectiveParsedData.currency || '$'}{item.unit_price?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[12px] font-medium text-[#182026]">
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
    </section>
  );
}
